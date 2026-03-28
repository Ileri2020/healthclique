import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const modelMap: Record<string, any> = {
  product: prisma.product,
  category: prisma.category,
  brand: prisma.brand,
  activeIngredient: prisma.activeIngredient,
  healthConcern: prisma.healthConcern,
  stock: prisma.stock,
  bulkPrice: prisma.bulkPrice,
  user: prisma.user,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { model, operations } = await req.json();
    
    if (!model || !modelMap[model] || !Array.isArray(operations)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // operations: [{ type: 'update' | 'create' | 'delete', id?, data }]
    const results = await prisma.$transaction(
      operations.map((op: any) => {
        if (op.type === 'update') {
          return modelMap[model].update({ where: { id: op.id }, data: op.data });
        } else if (op.type === 'create') {
          return modelMap[model].create({ data: op.data });
        } else if (op.type === 'delete') {
          return modelMap[model].delete({ where: { id: op.id } });
        }
        throw new Error(`Unsupported operation type: ${op.type}`);
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Batch operation failed:", error);
    return NextResponse.json({ error: error.message || "Batch operation failed" }, { status: 500 });
  }
}