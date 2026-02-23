"use server";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import { auth } from "@/auth";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

const PRICE_MARKUPS: Record<string, number> = {
  customer: 1.3,
  professional: 1.2,
  wholesaler: 1.1,
  admin: 1.1,
  staff: 1.1,
  visitor: 1.3,
  user: 1.3,
};

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
  message: prisma.message,
  brand: prisma.brand,
  // @ts-ignore
  priceFeedback: prisma.priceFeedback,
};

// =====================
// Utilities
// =====================
function parseId(id: string | null, model: string) {
  if (!id) return null;
  return ["user", "category", "product", "brand"].includes(model) ? id : Number(id);
}

async function handleUpload(file: File | string) {
  let dataURI = typeof file === "string" ? file : "";
  if (typeof file !== "string") {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    dataURI = `data:${file.type};base64,${b64}`;
  }
  return await cloudinary.v2.uploader.upload(dataURI, { resource_type: "auto" });
}

// ==================== GET ====================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");
  const limit = parseInt(searchParams.get("limit") || "50");
  const minimal = searchParams.get("minimal") === "true";

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];

  try {
    if (!id) {
      if (model === "featuredProduct") {
        return NextResponse.json(await prisma.featuredProduct.findMany({
          take: limit,
          include: { 
            product: { 
              include: { 
                category: true, 
                stock: !minimal, 
                reviews: false // Never load reviews for lists
              } 
            } 
          },
        }));
      }

      if (model === "review" || model === "post") {
        return NextResponse.json(await prismaModel.findMany({
          take: limit,
          include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        }));
      }

      if (model === "category") {
        return NextResponse.json(await prisma.category.findMany({
          include: { 
            products: { take: 3, select: { images: true } },
            _count: { select: { products: true } }
          }
        }));
      }

      if (model === "product") {
        const brand = searchParams.get("brand");
        const categoryId = searchParams.get("categoryId");
        const includeParams = searchParams.get("include")?.split(",");
        
        const where: any = {};
        if (brand) where.brand = { contains: brand, mode: 'insensitive' };
        if (categoryId) where.categoryId = categoryId;

        const include: any = {};
        if (includeParams) {
          includeParams.forEach(inc => { if (inc !== 'reviews') include[inc] = true; });
        } else if (!minimal) {
          include.category = true;
          include.stock = true;
        } else {
          include.category = true;
        }

        return NextResponse.json(await prisma.product.findMany({
          where,
          include: Object.keys(include).length > 0 ? include : undefined,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }));
      }

      return NextResponse.json(await prismaModel.findMany({ take: limit }));
    } else {
      // Single item fetch
      const include: any = {};
      if (model === "product") {
        include.category = true;
        include.stock = true;
        include.reviews = { include: { user: { select: { name: true, avatarUrl: true } } } };
      }
      
      const item = await prismaModel.findUnique({ 
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined
      });
      if (!item) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      return NextResponse.json(item);
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
  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  const protectedModels = ["product", "category", "featuredProduct", "stock", "coupon", "brand", "post"];
  if (protectedModels.includes(model || "") && role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    if (files.length > 0) {
      const urls = [];
      for (const file of files) {
        const uploadRes = await handleUpload(file);
        urls.push(uploadRes.url);
      }
      if (model === "product") body.images = urls;
      if (model === "user") body.avatarUrl = urls[0];
      if (model === "category") body.image = urls[0];
      if (model === "post") body.contentUrl = urls[0];
    }
    formData.forEach((value, key) => { if (key !== "file") body[key] = value; });
  } else {
    body = await req.json();
  }

  try {
    if (model === "cart") {
      const { userId, products, status } = body;
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: products.map((p: any) => p.productId) } },
        select: { id: true, price: true },
      });

      let total = 0;
      let userRole = "customer";
      if (userId && userId !== "nil") {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) userRole = dbUser.role;
      }
      const markup = PRICE_MARKUPS[userRole] || 1.3;

      products.forEach((item: any) => {
        const found = dbProducts.find((p) => p.id === item.productId);
        if (found) total += (found.price * markup) * item.quantity;
      });

      return NextResponse.json(await prisma.cart.create({
        data: {
          userId,
          total,
          status: status || "pending",
          products: { create: products.map((p: any) => ({ productId: p.productId, quantity: p.quantity })) },
        },
        include: { products: true },
      }));
    }

    if (model === "user" && body.password) {
      body.password = await bcrypt.hash(body.password, await bcrypt.genSalt());
    }

    // Parsing
    if (body.price) body.price = parseFloat(body.price);
    ['requiresPrescription', 'scarce'].forEach(field => {
       if (body[field] === "true") body[field] = true;
       if (body[field] === "false") body[field] = false;
    });

    return NextResponse.json(await prismaModel.create({ data: body }));
  } catch (error) {
    console.error("Database POST error:", error);
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

// ==================== PUT ====================
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  if (model !== "user" && role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (file) {
      const uploadRes = await handleUpload(file);
      if (model === "category") body.image = uploadRes.url;
      if (model === "user") body.avatarUrl = uploadRes.url;
      if (model === "product") body.images = [uploadRes.url];
    }
    formData.forEach((value, key) => { if (key !== "file") body[key] = value; });
  } else {
    body = await req.json();
  }

  const id = parseId(body.id, model);
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { id: _, ...updatedData } = body;
  try {
    return NextResponse.json(await prismaModel.update({
      where: { id: String(id) },
      data: updatedData,
    }));
  } catch (error) {
    console.error("Database PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");
  const session = await auth();
  const role = (session?.user as any)?.role || "visitor";

  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!model || !modelMap[model] || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    await modelMap[model].delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
