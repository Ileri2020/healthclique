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

  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  // ==================== Handle FormData ====================
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();

    // 1️⃣ Handle file uploads
    const files = formData.getAll("file") as File[];
    if (files?.length > 0) {
      const urls: string[] = [];
      for (const file of files) {
        const uploadRes = await handleUpload(file);
        urls.push(uploadRes.url);
      }

      if (model === "product") body.images = urls;
      if (model === "user") body.avatarUrl = urls[0]; // single avatar
      if (model === "category") body.image = urls[0]; // single category image
    }

    // 2️⃣ Merge other FormData values
    formData.forEach((value, key) => {
      if (key === "file") return; // skip files
      body[key] = value;
    });
  } 
  // ==================== Handle JSON ====================
  else if (contentType.includes("application/json")) {
    body = await req.json();
  } 
  else {
    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
  }

  try {
    // ==================== Model-specific logic ====================

    // --- CART: calculate total ---
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

    // --- USER: hash password ---
    if (model === "user" && body.password) {
      const salt = await bcrypt.genSalt();
      body.password = await bcrypt.hash(body.password, salt);
    }

    // --- Ensure numeric fields ---
    if (body.price) body.price = parseFloat(body.price);

    // 4️⃣ Create new item
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
  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  const body: any = {};

  let data: Record<string, any> = {};

  // ==================== FormData ====================
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    console.log("PUT formData entries:", Array.from(formData.entries()));
    data = Object.fromEntries(formData.entries());

    // ⿡ Handle file uploads
    const file = formData.get("file") as File | null;
    if (file) {
      try {
        const uploadRes = await handleUpload(file);
        console.log("Upload cloudinary response:", uploadRes);
        if (model === "category") body.image = uploadRes.url;
        if (model === "user") body.avatarUrl = uploadRes.url;
        if (model === "product") body.images = [uploadRes.url];
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
      }
    } else if (formData.get("image")) {
      body.image = formData.get("image") as string;
    }

    // ⿢ Merge other fields from FormData
    formData.forEach((value, key) => {
      if (key === "file" || key === "image") return;
      body[key] = value;
    });
  } 
  // ==================== JSON ====================
  else if (contentType.includes("application/json")) {
    data = await req.json();
    Object.assign(body, data); // merge JSON into body

    // If JSON includes file URLs (e.g., avatarUrl, images, image), preserve them
    if (data.avatarUrl && model === "user") body.avatarUrl = data.avatarUrl;
    if (data.image && model === "category") body.image = data.image;
    if (data.images && model === "product") body.images = data.images;
  } 
  // ==================== Unsupported ====================
  else {
    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
  }

  // ⿣ Ensure ID exists
  const id = parseId(body.id, model);
  if (!id) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

  // ⿤ Remove `id` from body before update
  const { id: _ignore, ...updatedData } = body;

  // ⿥ Ensure updatedData is not empty
  if (!updatedData || Object.keys(updatedData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  console.log("Updating item with data:", updatedData, "model:", model, "id:", id);

  // ⿦ Perform update
  try {
    const updatedItem = await prismaModel.update({
      where: { id: String(id) },
      data: updatedData,
    });
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






// // ==================== POST ====================
// export async function POST(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const model = searchParams.get("model");

//   if (!model || !modelMap[model]) {
//     return NextResponse.json({ error: "Invalid model" }, { status: 400 });
//   }

//   const prismaModel = modelMap[model];
//   const formData = await req.formData();
//   const body: any = {};

//   // 1️⃣ Handle file uploads
//   const files = formData.getAll("file") as File[];
//   if (files?.length > 0) {
//     const urls: string[] = [];
//     for (const file of files) {
//       const uploadRes = await handleUpload(file);
//       urls.push(uploadRes.url);
//     }

//     if (model === "product") body.images = urls;
//     if (model === "user") body.avatarUrl = urls[0]; // single avatar
//     if (model === "category") body.image = urls[0]; // single category image
//   }

//   // 2️⃣ Merge other FormData values
//   formData.forEach((value, key) => {
//     if (key === "file") return; // skip files
//     body[key] = value;
//   });

//   try {
//     // 3️⃣ Model-specific logic

//     // --- CART: calculate total ---
//     if (model === "cart") {
//       const { userId, products, status } = body;

//       const productIds = products.map((p: any) => p.productId);
//       const dbProducts = await prisma.product.findMany({
//         where: { id: { in: productIds } },
//         select: { id: true, price: true },
//       });

//       let total = 0;
//       products.forEach((item: any) => {
//         const found = dbProducts.find((p) => p.id === item.productId);
//         if (found) total += found.price * item.quantity;
//       });

//       const newCart = await prisma.cart.create({
//         data: {
//           userId,
//           total,
//           status: status || "pending",
//           products: { create: products.map((p: any) => ({ productId: p.productId, quantity: p.quantity })) },
//         },
//         include: { products: true },
//       });

//       return NextResponse.json(newCart);
//     }

//     // --- USER: hash password ---
//     if (model === "user" && body.password) {
//       const salt = await bcrypt.genSalt();
//       body.password = await bcrypt.hash(body.password, salt);
//     }

//     // --- Ensure numeric fields ---
//     if (body.price) body.price = parseFloat(body.price);

//     // 4️⃣ Create new item
//     const newItem = await prismaModel.create({ data: body });
//     return NextResponse.json(newItem);
//   } catch (error) {
//     console.error("Database POST error:", error);
//     return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
//   }
// }




































































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
