"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import { auth } from "@/auth";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  comment: prisma.comment,
  comments: prisma.comment,
  like: prisma.like,
  likes: prisma.like,
  brand: prisma.brand,
  activeIngredient: prisma.activeIngredient,
  healthConcern: prisma.healthConcern,
  bulkPrice: prisma.bulkPrice,
  // @ts-ignore
  priceFeedback: prisma.priceFeedback,
  deliveryFee: prisma.deliveryFee,
};

// =====================
// Utilities
// =====================
function parseId(id: string | null, model: string) {
  if (!id) return null;
  return id;
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
  const offset = parseInt(searchParams.get("offset") || "0");
  const minimal = searchParams.get("minimal") === "true";

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const isStaff = sessionUser?.role === "admin" || sessionUser?.role === "staff";
  const prismaModel = modelMap[model];

  try {
    if (["comment", "comments", "like", "likes"].includes(model) && id) {
      return NextResponse.json(await prismaModel.findMany({
        where: { contentId: id },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }));
    }
    if (["comment", "comments", "like", "likes"].includes(model)) {
      return NextResponse.json({ error: "A post ID is required." }, { status: 400 });
    }

    if (model === "user") {
      const select = {
        id: true,
        name: true,
        email: true,
        contact: true,
        role: true,
        verificationStatus: true,
        avatarUrl: true,
        licenseImage: true,
        professionalType: true,
        regNumber: true,
        facilityName: true,
        facilityAddress: true,
        facilityRegNumber: true,
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedReturns: true,
      };
      if (id) {
        if (!sessionUser?.id || (!isStaff && sessionUser.id !== id)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const user = await prisma.user.findUnique({ where: { id }, select });
        if (!user) return NextResponse.json({ error: "Document not found" }, { status: 404 });
        return NextResponse.json(user);
      }
      if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const users = await prisma.user.findMany({
        where: isStaff ? {} : { role: { in: ["admin", "staff"] } },
        select,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(users);
    }

    if (model === "message" && !id) {
      if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }] },
        include: { sender: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(messages);
    }

    if (!id) {
      if (model === "featuredProduct") {
        return NextResponse.json(await prisma.featuredProduct.findMany({
          take: limit,
          skip: offset,
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

      if (model === "review") {
        return NextResponse.json(await prismaModel.findMany({
          take: limit,
          skip: offset,
          include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        }));
      }

      if (model === "post") {
        const posts = await prisma.post.findMany({
          take: limit,
          skip: offset,
          include: { author: { select: { id: true, email: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(posts.map(({ author, ...post }) => ({ ...post, user: author })));
      }

      if (model === "category") {
        return NextResponse.json(await prisma.category.findMany({
          take: limit,
          skip: offset,
          include: { 
            products: { take: 3, select: { images: true } },
            _count: { select: { products: true } }
          }
        }));
      }

      if (model === "product") {
        const brand = searchParams.get("brand");
        const categoryId = searchParams.get("categoryId");
        const categoryName = searchParams.get("categoryName");
        const concern = searchParams.get("concern");
        const includeParams = searchParams.get("include")?.split(",");
        
        const where: any = {};
        if (brand) where.brand = { name: { equals: brand.trim(), mode: 'insensitive' } };
        if (categoryId) where.categoryId = categoryId;
        if (categoryName) where.category = { name: { equals: categoryName.trim(), mode: 'insensitive' } };
        if (concern) where.category = { name: { equals: concern.trim(), mode: 'insensitive' } };

        const searchQuery = searchParams.get("query")?.trim();
        if (searchQuery) {
          where.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { brand: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { category: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { activeIngredients: { some: { name: { contains: searchQuery, mode: 'insensitive' } } } },
          ];
        }

        if (searchParams.get("requireImages") === "true") {
          where.images = { isEmpty: false };
        }
        if (searchParams.get("requirePrice") === "true") {
          where.price = { gt: 0 };
        }

        const include: any = {};
        if (includeParams) {
          includeParams.forEach(inc => { if (inc !== 'reviews') include[inc] = true; });
        } else if (!minimal) {
          include.category = true;
          include.stock = true;
          include.brand = true;
          include.activeIngredients = true;
          include.healthConcerns = true;
          include.bulkPrices = true;
        } else {
          include.category = true;
        }

        const query = {
          where,
          include: Object.keys(include).length > 0 ? include : undefined,
          take: Math.min(limit, 5000), // Cap product fetch to 5000
          skip: offset,
          orderBy: { createdAt: 'desc' as const }
        };

        if (searchParams.get("pagination") === "true") {
          const [data, total] = await Promise.all([
            prisma.product.findMany(query),
            prisma.product.count({ where })
          ]);
          return NextResponse.json({ data, total });
        }

        return NextResponse.json(await prisma.product.findMany(query));
      }

      if (model === "category") {
        return NextResponse.json(await prisma.category.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "brand") {
        return NextResponse.json(await prisma.brand.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { order: 'asc' }
        }));
      }

      if (model === "activeIngredient") {
        return NextResponse.json(await prisma.activeIngredient.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "healthConcern") {
        return NextResponse.json(await prisma.healthConcern.findMany({
          take: limit,
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        }));
      }

      if (model === "bulkPrice") {
        return NextResponse.json(await prisma.bulkPrice.findMany({
          take: limit,
          include: { product: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }));
      }

      const userId = searchParams.get("userId");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const status = searchParams.get("status"); // CSV support
      const where: any = {};

      if (userId) where.userId = userId;
      if (model === "shippingAddress") {
        if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (userId && !isStaff && userId !== sessionUser.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (!isStaff) where.userId = sessionUser.id;
      }
      if (model === "coupon" && code) where.code = code;
      if (model === "deliveryFee" && state) where.state = state;
      
      if (model === "cart" && status) {
          where.status = { in: status.split(",").map(s => s.trim()) };
      }

      if (model === "cart") {
          if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          if (!isStaff) where.userId = sessionUser.id;
          return NextResponse.json(await prisma.cart.findMany({
              where,
              include: {
                  user: { select: { id: true, email: true, name: true, contact: true } },
                  products: { include: { product: true } },
                  payment: true
              },
              take: limit,
              skip: offset,
              orderBy: { createdAt: 'desc' }
          }));
      }

      return NextResponse.json(await prismaModel.findMany({ 
        where, 
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }));
    } else {
      // Single item fetch
      const include: any = {};
      if (model === "product") {
        include.category = true;
        include.stock = true;
        include.brand = true;
        include.activeIngredients = true;
        include.healthConcerns = true;
        include.bulkPrices = true;
        include.reviews = { include: { user: { select: { name: true, avatarUrl: true } } } };
      }

      if (model === "cart") {
          include.user = { select: { id: true, email: true, name: true, contact: true, addresses: true } };
          include.products = { include: { product: true } };
          include.payment = true;
      }
      
      const item = await prismaModel.findUnique({ 
        where: { id },
        include: Object.keys(include).length > 0 ? include : undefined
      });
      if (!item) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      if (model === "post") {
        const post = await prisma.post.findUnique({
          where: { id },
          include: { author: { select: { id: true, email: true, name: true, avatarUrl: true } } },
        });
        if (!post) return NextResponse.json({ error: "Document not found" }, { status: 404 });
        const { author, ...postData } = post;
        return NextResponse.json({ ...postData, user: author });
      }
      if (model === "cart" && !isStaff && item.userId !== sessionUser?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (model === "shippingAddress" && !isStaff && item.userId !== sessionUser?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (model === "message" && item.senderId !== sessionUser?.id && item.receiverId !== sessionUser?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
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
      const urls: string[] = [];
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

  const sessionUser = session?.user as { id?: string } | undefined;
  if (model === "review" || model === "priceFeedback") {
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (body.userId && body.userId !== sessionUser.id) {
      return NextResponse.json({ error: "The submitted user does not match the signed-in account." }, { status: 403 });
    }
    if (typeof body.productId !== "string" || !body.productId) {
      return NextResponse.json({ error: "A product ID is required." }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { id: body.productId }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    body.userId = sessionUser.id;
    if (model === "review" && (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)) {
      return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
    }
    if (model === "priceFeedback" && (typeof body.feedback !== "string" || !body.feedback.trim())) {
      return NextResponse.json({ error: "Price feedback is required." }, { status: 400 });
    }
  }

  if (["comment", "comments", "like", "likes"].includes(model)) {
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const contentId = typeof body.contentId === "string" ? body.contentId : "";
    if (!contentId || (body.userId && body.userId !== sessionUser.id)) {
      return NextResponse.json({ error: "Invalid content or user." }, { status: 400 });
    }
    const content = await prisma.post.findUnique({ where: { id: contentId }, select: { id: true } });
    if (!content) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    if (model === "like" || model === "likes") {
      const like = await prisma.like.upsert({
        where: { userId_contentId: { userId: sessionUser.id, contentId } },
        update: {},
        create: { userId: sessionUser.id, contentId },
      });
      return NextResponse.json(like, { status: 201 });
    }

    const username = typeof session?.user?.name === "string" ? session.user.name : "User";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!comment) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
    return NextResponse.json(await prisma.comment.create({
      data: { userId: sessionUser.id, username, contentId, comment },
    }), { status: 201 });
  }

  if (model === "shippingAddress" && (!sessionUser?.id || body.userId !== sessionUser.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (model === "cart" && (!sessionUser?.id || body.userId !== sessionUser.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (model === "message" && (!sessionUser?.id || body.senderId !== sessionUser.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    if (model === "cart") {
      const { userId, products, status } = body;
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: products.map((p: any) => p.productId).filter(Boolean) } },
        select: { id: true, price: true, bulkPrices: true },
      });

      let total = 0;
      let userRole = "customer";
      if (userId && userId !== "nil") {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) userRole = dbUser.role;
      }
      const markup = PRICE_MARKUPS[userRole] || 1.3;

      products.forEach((item: any) => {
        if (item.productId?.startsWith("special-")) {
            total += (item.customPrice || 0) * item.quantity;
            return;
        }
        
        const found = dbProducts.find((p) => p.id === item.productId);
        if (found) {
            let itemPrice = found.price;
            if (item.bulkPriceId) {
                const bulk = found.bulkPrices.find(b => b.id === item.bulkPriceId);
                if (bulk) itemPrice = bulk.price;
            }
            total += (itemPrice * markup) * item.quantity;
        }
      });

      return NextResponse.json(await prisma.cart.create({
        data: {
          userId,
          total,
          status: status || "pending",
          products: { 
            create: products.map((p: any) => ({ 
              productId: p.productId && !p.productId.startsWith('special-') ? p.productId : null, 
              quantity: p.quantity,
              customName: p.customName || (p.productId?.startsWith('special-') ? p.name : null),
              customPrice: p.customPrice,
              bulkPriceId: p.bulkPriceId,
              isSpecial: !!p.isSpecial || p.productId?.startsWith('special-')
            })) 
          },
        },
        include: { products: true },
      }));
    }

    if (model === "user" && body.password) {
      body.password = await bcrypt.hash(body.password, await bcrypt.genSalt());
    }

    // Parsing
    if (body.price) body.price = parseFloat(body.price);
    ['requiresPrescription', 'scarce', 'isRead'].forEach(field => {
       if (body[field] === "true") body[field] = true;
       if (body[field] === "false") body[field] = false;
    });

    if (model === "product") {
      if (body.brand) {
        body.brand = { connectOrCreate: { where: { name: body.brand }, create: { name: body.brand } } };
      } else {
        delete body.brand;
      }
      if (Array.isArray(body.activeIngredients)) {
        body.activeIngredients = { connectOrCreate: body.activeIngredients.map((name: string) => ({ where: { name }, create: { name } })) };
      }
      if (Array.isArray(body.healthConcerns)) {
        body.healthConcerns = { connectOrCreate: body.healthConcerns.map((name: string) => ({ where: { name }, create: { name } })) };
      }
      if (Array.isArray(body.bulkPrices)) {
        body.bulkPrices = {
          create: body.bulkPrices.map((bp: any) => ({
            name: bp.name,
            quantity: parseInt(bp.quantity),
            price: parseFloat(bp.price)
          }))
        };
      }
    }

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

  // Support for bulk brand reordering
  if (model === "brand" && Array.isArray(body)) {
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
    try {
      const updates = body.map((item: any) => 
        prisma.brand.update({
          where: { id: item.id },
          data: { order: parseInt(item.order) || 0 }
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, count: updates.length });
    } catch (error) {
      console.error("Bulk update error:", error);
      return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
    }
  }

  const id = parseId(body.id || searchParams.get("id"), model);
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { id: _, ...updatedData } = body;
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const isStaff = role === "admin" || role === "staff";
  if (!isStaff) {
    if (model === "user") {
      if (!sessionUser?.id || sessionUser.id !== id) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }
      if (updatedData.role !== undefined && !["customer", "professional", "wholesaler"].includes(updatedData.role)) {
        return NextResponse.json({ error: "Invalid account role" }, { status: 403 });
      }
      if (updatedData.verificationStatus !== undefined && !["unverified", "pending"].includes(updatedData.verificationStatus)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 403 });
      }
    } else if (model === "cart" && Object.keys(updatedData).every(key => key === "name")) {
      const cart = await prisma.cart.findUnique({ where: { id }, select: { userId: true } });
      if (!sessionUser?.id || cart?.userId !== sessionUser.id) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }
    } else if (model === "shippingAddress") {
      const address = await prisma.shippingAddress.findUnique({ where: { id }, select: { userId: true } });
      if (!sessionUser?.id || address?.userId !== sessionUser.id || (updatedData.userId !== undefined && updatedData.userId !== sessionUser.id)) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }
    } else if (model === "message" && Object.keys(updatedData).every(key => key === "isRead") && updatedData.isRead === true) {
      const message = await prisma.message.findUnique({ where: { id }, select: { receiverId: true } });
      if (!sessionUser?.id || message?.receiverId !== sessionUser.id) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
  }
  
  if (updatedData.isRead === "true") updatedData.isRead = true;
  if (updatedData.isRead === "false") updatedData.isRead = false;

  if (model === "product") {
    if (updatedData.brand !== undefined) {
      if (updatedData.brand) {
        updatedData.brand = { connectOrCreate: { where: { name: updatedData.brand }, create: { name: updatedData.brand } } };
      } else {
        updatedData.brand = { disconnect: true };
      }
    }
    if (updatedData.category !== undefined || updatedData.categoryId !== undefined) {
      const categoryValue = updatedData.category || updatedData.categoryId;
      if (categoryValue) {
        // If it's already an ID (ObjectId), connect directly
        if (typeof categoryValue === 'string' && categoryValue.match(/^[0-9a-fA-F]{24}$/)) {
          updatedData.category = { connect: { id: categoryValue } };
        } else {
          // Otherwise treat as name and connectOrCreate
          updatedData.category = { connectOrCreate: { where: { name: categoryValue }, create: { name: categoryValue } } };
        }
      } else {
        updatedData.category = { disconnect: true };
      }
      // Remove categoryId to avoid conflicts
      delete updatedData.categoryId;
    }
    if (updatedData.images !== undefined) {
      if (Array.isArray(updatedData.images)) {
        updatedData.images = updatedData.images.map((item: any) => String(item).trim()).filter(Boolean);
      } else if (typeof updatedData.images === 'string') {
        updatedData.images = updatedData.images.trim() ? [updatedData.images.trim()] : [];
      } else {
        delete updatedData.images;
      }
    }
    if (Array.isArray(updatedData.activeIngredients)) {
      updatedData.activeIngredients = { set: [], connectOrCreate: updatedData.activeIngredients.map((name: string) => ({ where: { name }, create: { name } })) };
    }
    if (Array.isArray(updatedData.healthConcerns)) {
      updatedData.healthConcerns = { set: [], connectOrCreate: updatedData.healthConcerns.map((name: string) => ({ where: { name }, create: { name } })) };
    }
    if (Array.isArray(updatedData.bulkPrices)) {
      updatedData.bulkPrices = {
        deleteMany: {},
        create: updatedData.bulkPrices.map((bp: any) => ({
          name: bp.name,
          quantity: parseInt(bp.quantity),
          price: parseFloat(bp.price)
        }))
      };
    }
  }
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

  if (!model || !modelMap[model] || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    if (["comment", "comments", "like", "likes"].includes(model)) {
      const session = await auth();
      const sessionUser = session?.user as { id?: string; role?: string } | undefined;
      if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const item = await modelMap[model].findUnique({ where: { id }, select: { userId: true } });
      if (!item) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      if (item.userId !== sessionUser.id && sessionUser.role !== "admin" && sessionUser.role !== "staff") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      await modelMap[model].delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await modelMap[model].delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
