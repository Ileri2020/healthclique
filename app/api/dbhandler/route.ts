"use server";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

// Centralized model mapping
const modelMap: Record<string, any> = {
  cart: prisma.cart,
  cartItem: prisma.cartItem,
  category: prisma.category,
  coupon: prisma.coupon,
  featuredProduct: prisma.featuredProduct,
  notification: prisma.notification,
  payment: prisma.payment,
  post: prisma.post,
  product: prisma.product,
  refund: prisma.refund,
  review: prisma.review,
  shippingAddress: prisma.shippingAddress,
  stock: prisma.stock,
  user: prisma.user,
};

// =====================
// Utilities
// =====================
async function parseJson(req: NextRequest) {
  try {
    const json = await req.json();
    return typeof json === "object" && json !== null ? json : {};
  } catch (err) {
    return {};
  }
}

function parseId(id: string | null, model: string) {
  if (!id) return null;
  return ["user", "category", "product"].includes(model) ? id : Number(id);
}

async function handleUpload(file: File | string) {
  let dataURI = typeof file === "string" ? file : "";

  if (typeof file !== "string") {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    dataURI = `data:${file.type};base64,${b64}`;
  }

  const res = await cloudinary.v2.uploader.upload(dataURI, { resource_type: "auto" });
  return res;
}

// ==================== GET ====================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model") || null;
  const id = parseId(searchParams.get("id"), model || "");

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];

  try {
    if (!id) {
      if (model === "featuredProduct") {
        const items = await prisma.featuredProduct.findMany({
          include: { product: { include: { category: true, stock: true, reviews: true } } },
        });
        return NextResponse.json(items);
      }

      if (model === "review" || model === "post") {
        const items = await prismaModel.findMany({
          include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
        });
        return NextResponse.json(items);
      }

      return NextResponse.json(await prismaModel.findMany());
    } else {
      if (model === "review") {
        const items = await prismaModel.findMany({ where: { contentId: id } });
        return NextResponse.json(items);
      } else {
        const item = await prismaModel.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Document not found" }, { status: 404 });
        return NextResponse.json(item);
      }
    }
  } catch (error) {
    console.error("Database GET error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// ==================== POST ====================
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const prismaModel = modelMap[model];
  const formData = await req.formData();
  const body: any = {};

  // Convert FormData to object (excluding files)
  formData.forEach((value, key) => {
    if (key !== "file") body[key] = value;
  });

  // Handle file upload for products
  if (model === "product") {
    const files = formData.getAll("file") as File[];
    const urls: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const res = await handleUpload(file);
        urls.push(res.url);
      }
    }

    // Ensure images is always an array
    body.images = urls;

    // Ensure required fields are present
    body.name = body.name?.toString().trim() || "Unnamed Product";
    body.categoryId = body.categoryId?.toString() || "";
    body.description = body.description?.toString() || "";
    body.price = body.price ? parseFloat(body.price as string) : 0;

    // Ensure relations default to empty object if Prisma expects object
    console.log("Product body to create:", body);
  } else {
    // Handle single file for other models (user, category)
    const file = formData.get("file") as File | null;
    if (file) {
      const uploadRes = await handleUpload(file);
      if (model === "user") body.avatarUrl = uploadRes.url;
      if (model === "category") body.image = uploadRes.url;
    }

    // Ensure any optional relation fields are objects
    if (model === "user" && !body.profile) body.profile = {};
    if (model === "category" && !body.products) body.products = [];
  }

  try {
    // Special handling for cart creation
    if (model === "cart") {
      const { userId, products, status } = body;
      const productIds = products.map((p: any) => p.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      let total = 0;
      products.forEach((item: any) => {
        const found = dbProducts.find((p) => p.id === item.productId);
        if (found) total += found.price * item.quantity;
      });

      const newCart = await prisma.cart.create({
        data: {
          userId,
          total,
          status: status || "pending",
          products: { create: products.map((p: any) => ({ productId: p.productId, quantity: p.quantity })) },
        },
        include: { products: true },
      });

      return NextResponse.json(newCart);
    }

    // Hash password for users
    if (model === "user" && body.password) {
      const salt = await bcrypt.genSalt();
      body.password = await bcrypt.hash(body.password, salt);
    }

    // Ensure price is number
    if (body.price) body.price = parseFloat(body.price);

    // Create new item in DB
    const newItem = await prismaModel.create({ data: body });
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Database POST error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}



// ==================== PUT ====================
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];
  const formData = await req.formData();
  const body: any = {};

  // Handle file upload (support multiple files for products)
  if (model === "product") {
    const files = formData.getAll("file") as File[];
    if (files && files.length > 0) {
      const urls: string[] = [];
      for (const file of files) {
        const res = await handleUpload(file);
        urls.push(res.url);
      }
      body.images = urls;
    }
  } else {
    const file = formData.get("file") as File | null;
    if (file) {
      const uploadRes = await handleUpload(file);
      if (model === "user") body.avatarUrl = uploadRes.url;
      if (model === "category") body.image = uploadRes.url;
    }
  }

  // Merge other fields
  formData.forEach((value, key) => {
    if (key !== "file") body[key] = value;
  });

  const id = parseId(body.id, model);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (model === "user" && body.password) {
    const salt = await bcrypt.genSalt();
    body.password = await bcrypt.hash(body.password, salt);
  }

  try {
    const { id: _ignore, ...updatedData } = body;
    const updatedItem = await prismaModel.update({ where: { id }, data: updatedData });
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Database PUT error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const prismaModel = modelMap[model];

  try {
    await prismaModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}











































































// "use server";

// import { PrismaClient } from '@prisma/client';
// import { NextRequest } from 'next/server';
// import bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// // Centralized model mapping
// const modelMap: Record<string, any> = {
//   cart: prisma.cart,
//   cartItem: prisma.cartItem,
//   category: prisma.category,
//   coupon: prisma.coupon,
//   featuredProduct: prisma.featuredProduct,
//   notification: prisma.notification,
//   payment: prisma.payment,
//   post: prisma.post,
//   product: prisma.product,
//   refund: prisma.refund,
//   review: prisma.review,
//   shippingAddress: prisma.shippingAddress,
//   stock: prisma.stock,
//   user: prisma.user,
// };

// // Utility: parse JSON safely
// async function parseJson(req: NextRequest) {
//   try {
//     const json = await req.json();
//     return typeof json === "object" && json !== null ? json : {};
//   } catch (err) {
//     return {};
//   }
// }


// // Utility: convert id to proper type based on model
// function parseId(id: string | null, model: string) {
//   if (!id) return null;
//   // Assuming `user` uses string id (UUID) and others are numbers
//   return model === 'user' ? id : Number(id);
// }

// // ==================== GET ====================
// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const model = searchParams.get('model') || null;
//   const id = parseId(searchParams.get('id'), model || '');

//   if (!model || !modelMap[model]) {
//     return new Response(JSON.stringify({ message: "Invalid model" }), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }

//   const prismaModel = modelMap[model];

//   try {
//     if (!id) {
//       // Fetch all items
//       if (model === 'featuredProduct') {
//         const items = await prisma.featuredProduct.findMany({
//           include: {
//             product: {
//               include: {
//                 category: true,
//                 stock: true,
//                 reviews: true,
//               },
//             },
//           },
//         });
//         return new Response(JSON.stringify(items), {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' },
//         });
//       }

//       if (model === 'review' || model === 'post') {
//         const items = await prismaModel.findMany({
//           include: {
//             user: { select: { id: true, email: true, name: true, avatarUrl: true } },
//           },
//         });
//         return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
//       } else {
//         const items = await prismaModel.findMany();
//         return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
//       }
//     } else {
//       // Fetch single item or related items
//       if (model === 'review') {
//         const items = await prismaModel.findMany({ where: { contentId: id } });
//         return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
//       } else {
//         const item = await prismaModel.findUnique({ where: { id } });
//         if (!item) return new Response(JSON.stringify({ error: "Document not found" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
//         return new Response(JSON.stringify(item), { status: 200, headers: { 'Content-Type': 'application/json' } });
//       }
//     }
//   } catch (error) {
//     console.error('Database GET error:', error);
//     return new Response(JSON.stringify({ error: 'Failed to fetch items' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
//   }
// }

// // ==================== POST ====================
// export async function POST(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const model = searchParams.get("model");

//   if (!model || !modelMap[model]) {
//     return new Response(JSON.stringify({ message: "Invalid model" }), {
//       status: 400,
//       headers: { "Content-Type": "application/json" },
//     });
//   }

//   const prismaModel = modelMap[model];
//   const body = await parseJson(req);
//   if (!body) return new Response("Invalid JSON", { status: 400 });

//   try {
//     const data = { ...body };
//     console.log("Data to create :", data);

//     // HANDLE CART CREATION (TOTAL IS NOW AUTO-CALCULATED)
//     if (model === "cart") {
//       const { userId, products, status } = data;

//       // 1. Fetch product prices from DB
//       const productIds = products.map((p) => p.productId);

//       const dbProducts = await prisma.product.findMany({
//         where: {
//           id: { in: productIds },
//         },
//         select: { id: true, price: true },
//       });

//       // 2. Calculate total based on quantity × price
//       let total = 0;

//       products.forEach((item) => {
//         const found = dbProducts.find((p) => p.id === item.productId);
//         if (found) {
//           total += found.price * item.quantity;
//         }
//       });

//       // 3. Create cart with calculated total
//       const newCart = await prisma.cart.create({
//         data: {
//           userId,
//           total,          // ← backend-generated
//           status: status || "pending",
//           products: {
//             create: products.map((p) => ({
//               productId: p.productId,
//               quantity: p.quantity,
//             })),
//           },
//         },
//         include: {
//           products: true,
//         },
//       });

//       return new Response(JSON.stringify(newCart), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });
//     }



//     // DEFAULT CREATE
//     const newItem = await prismaModel.create({
//       data,
//     });

//     return new Response(JSON.stringify(newItem), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Database POST error:", error);
//     return new Response(JSON.stringify({ error: "Failed to create item" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }


// // ==================== PUT ====================
// export async function PUT(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const model = searchParams.get('model') || null;

//   if (!model || !modelMap[model]) {
//     return new Response(JSON.stringify({ message: "Invalid model" }), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }

//   const prismaModel = modelMap[model];
//   const body = await parseJson(req);
//   if (!body) return new Response('Invalid JSON', { status: 400 });

//   const id = parseId(body.id, model);
//   if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

//   try {
//     const { id: _ignore, ...updatedData } = body;
//     const updatedItem = await prismaModel.update({ where: { id }, data: updatedData });
//     return new Response(JSON.stringify(updatedItem), { status: 200, headers: { 'Content-Type': 'application/json' } });
//   } catch (error) {
//     console.error('Database PUT error:', error);
//     return new Response(JSON.stringify({ error: 'Failed to update item' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
//   }
// }

// // ==================== DELETE ====================
// export async function DELETE(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const model = searchParams.get('model') || null;
//   const id = parseId(searchParams.get('id'), model || '');

//   if (!model || !modelMap[model]) {
//     return new Response(JSON.stringify({ message: "Invalid model" }), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
//   if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

//   const prismaModel = modelMap[model];

//   try {
//     await prismaModel.delete({ where: { id } });
//     return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
//   } catch (error) {
//     console.error('Database DELETE error:', error);
//     return new Response(JSON.stringify({ error: 'Failed to delete item' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
//   }
// }
