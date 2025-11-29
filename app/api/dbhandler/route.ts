"use server";

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';

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

// Utility: parse JSON safely
async function parseJson(req: NextRequest) {
  try {
    return await req.json();
  } catch (err) {
    return null;
  }
}

// Utility: convert id to proper type based on model
function parseId(id: string | null, model: string) {
  if (!id) return null;
  // Assuming `user` uses string id (UUID) and others are numbers
  return model === 'user' ? id : Number(id);
}

// ==================== GET ====================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model') || null;
  const id = parseId(searchParams.get('id'), model || '');

  if (!model || !modelMap[model]) {
    return new Response(JSON.stringify({ message: "Invalid model" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prismaModel = modelMap[model];

  try {
    if (!id) {
      // Fetch all items
      if (model === 'review' || model === 'post') {
        const items = await prismaModel.findMany({
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        });
        return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        const items = await prismaModel.findMany();
        return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      // Fetch single item or related items
      if (model === 'review') {
        const items = await prismaModel.findMany({ where: { contentId: id } });
        return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        const item = await prismaModel.findUnique({ where: { id } });
        if (!item) return new Response(JSON.stringify({ error: "Document not found" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify(item), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
  } catch (error) {
    console.error('Database GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch items' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// ==================== POST ====================
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model || !modelMap[model]) {
    return new Response(JSON.stringify({ message: "Invalid model" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prismaModel = modelMap[model];
  const body = await parseJson(req);
  if (!body) return new Response("Invalid JSON", { status: 400 });

  try {
    const data = { ...body };
    console.log("Data to create :", data);

    // HANDLE CART CREATION (TOTAL IS NOW AUTO-CALCULATED)
    if (model === "cart") {
      const { userId, products, status } = data;

      // 1. Fetch product prices from DB
      const productIds = products.map((p) => p.productId);

      const dbProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true, price: true },
      });

      // 2. Calculate total based on quantity × price
      let total = 0;

      products.forEach((item) => {
        const found = dbProducts.find((p) => p.id === item.productId);
        if (found) {
          total += found.price * item.quantity;
        }
      });

      // 3. Create cart with calculated total
      const newCart = await prisma.cart.create({
        data: {
          userId,
          total,          // ← backend-generated
          status: status || "pending",
          products: {
            create: products.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
            })),
          },
        },
        include: {
          products: true,
        },
      });

      return new Response(JSON.stringify(newCart), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }



    // DEFAULT CREATE
    const newItem = await prismaModel.create({
      data,
    });

    return new Response(JSON.stringify(newItem), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Database POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to create item" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


// ==================== PUT ====================
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model') || null;

  if (!model || !modelMap[model]) {
    return new Response(JSON.stringify({ message: "Invalid model" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prismaModel = modelMap[model];
  const body = await parseJson(req);
  if (!body) return new Response('Invalid JSON', { status: 400 });

  const id = parseId(body.id, model);
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const { id: _ignore, ...updatedData } = body;
    const updatedItem = await prismaModel.update({ where: { id }, data: updatedData });
    return new Response(JSON.stringify(updatedItem), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Database PUT error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update item' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model') || null;
  const id = parseId(searchParams.get('id'), model || '');

  if (!model || !modelMap[model]) {
    return new Response(JSON.stringify({ message: "Invalid model" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const prismaModel = modelMap[model];

  try {
    await prismaModel.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Database DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete item' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
