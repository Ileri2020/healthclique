import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  });
  return NextResponse.json({ productIds: wishlist.map(item => item.productId) });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let productId: unknown;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof productId !== "string" || productId.trim().length === 0) {
    return NextResponse.json({ error: "A product ID is required." }, { status: 400 });
  }
  const normalizedProductId = productId.trim();
  const product = await prisma.product.findUnique({
    where: { id: normalizedProductId },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId: normalizedProductId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ added: false });
  }

  await prisma.wishlist.create({ data: { userId, productId: normalizedProductId } });
  return NextResponse.json({ added: true });
}
