import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const isAdmin = sessionUser?.role === "admin" || sessionUser?.role === "staff";

  let where: any = {};
  if (isAdmin) {
    // Admin sees everything
    where = {};
  } else if (sessionUser?.id) {
    // User sees approved OR their own (even if unapproved)
    where = {
      OR: [
        { approved: true },
        { creatorId: sessionUser.id }
      ]
    };
  } else {
    // Visitor sees only approved
    where = { approved: true };
  }

  const products = await prisma.heavilyDiscountedProduct.findMany({
    where,
    include: {
      product: true,
      creator: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["professional", "admin", "staff"].includes(sessionUser.role ?? "")) {
    return NextResponse.json({ error: "Professional access required" }, { status: 403 });
  }

  const body = await req.json();
  const { productId } = body;
  if (typeof productId !== "string" || productId.trim().length === 0) {
    return NextResponse.json({ error: "A product ID is required" }, { status: 400 });
  }
  const newItem = await prisma.heavilyDiscountedProduct.create({
    data: { productId: productId.trim(), creatorId: sessionUser.id, approved: false },
  });
  return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
  const session = await auth();
  const sessionUser = session?.user as { role?: string } | undefined;
  if (!["admin", "staff"].includes(sessionUser?.role ?? "")) {
    return NextResponse.json({ error: "Administrator access required" }, { status: sessionUser ? 403 : 401 });
  }

  const body = await req.json();
  const { id, approved } = body;
  if (typeof id !== "string" || typeof approved !== "boolean") {
    return NextResponse.json({ error: "A valid ID and approval state are required" }, { status: 400 });
  }
  const updated = await prisma.heavilyDiscountedProduct.update({
    where: { id },
    data: { approved },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "A product listing ID is required" }, { status: 400 });
  }
  const item = await prisma.heavilyDiscountedProduct.findUnique({ where: { id }, select: { creatorId: true } });
  if (!item) {
    return NextResponse.json({ error: "Product listing not found" }, { status: 404 });
  }
  const isAdmin = sessionUser.role === "admin" || sessionUser.role === "staff";
  if (!isAdmin && item.creatorId !== sessionUser.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  await prisma.heavilyDiscountedProduct.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
