import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

// Unified Model Map for the entire Sheet System
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

async function logChange(model: string, operation: string, userId: string, recordId: string, changes: any) {
  try {
    await prisma.auditLog.create({
      data: {
        model,
        operation,
        userId,
        recordId,
        changes,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  
  // Optimization: Default limit to 70 as requested. 
  // Admin can override, but we cap it to 500 for safety unless explicitly needed.
  const requestedLimit = parseInt(searchParams.get("limit") || "70");
  const limit = isAdmin ? requestedLimit : Math.min(requestedLimit, 70);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  try {
    let data;
    if (model === "product") {
      data = await prisma.product.findMany({
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          activeIngredients: { select: { id: true, name: true } },
          stock: { select: { id: true, addedQuantity: true, costPerProduct: true, createdAt: true } },
          bulkPrices: { select: { id: true, name: true, quantity: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else if (model === "stock") {
      data = await prisma.stock.findMany({
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else if (model === "bulkPrice") {
      data = await prisma.bulkPrice.findMany({
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else {
      data = await modelMap[model].findMany({
        include: model === "category" || model === "brand" || model === "activeIngredient" 
          ? { _count: { select: { products: true } } } 
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    // Also return total count for pagination UI if needed
    const total = await modelMap[model].count();

    return NextResponse.json({ data, total, limit, offset });
  } catch (error) {
    console.error("Sheet Fetch Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { model, id, field, value } = await req.json();
    const prismaModel = modelMap[model];
    if (!prismaModel) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

    let updateData: any = {};

    // --- Complex Relation Handling Logic ---
    if (model === "product") {
      if (field === "categoryId") {
        updateData.category = { connect: { id: value } };
      } else if (field === "brandId") {
        updateData.brand = value ? { connect: { id: value } } : { disconnect: true };
      } else if (field === "activeIngredients") {
        // Value is expected to be an array of ingredient names or IDs
        // Based on your previous logic, using names as stable identifiers for connectOrCreate
        updateData.activeIngredients = { 
          set: [], 
          connectOrCreate: value.map((name: string) => ({ 
            where: { name }, 
            create: { name } 
          })) 
        };
      } else if (field === "price") {
        updateData.price = parseFloat(value) || 0;
      } else {
        updateData[field] = value;
      }
    } else if (model === "stock" || model === "bulkPrice") {
      if (field === "productId") {
        updateData.product = { connect: { id: value } };
      } else if (field === "addedQuantity" || field === "quantity") {
        updateData[field] = parseInt(value) || 0;
      } else if (field === "costPerProduct" || field === "price") {
        updateData[field] = parseFloat(value) || 0;
      } else {
        updateData[field] = value;
      }
    } else if (model === "brand" && field === "order") {
      updateData.order = parseInt(value) || 0;
    } else {
      updateData[field] = value;
    }

    const item = await prismaModel.findUnique({ where: { id }, select: { version: true } });
    if (!item) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const updated = await prismaModel.update({
      where: { id, version: item.version },
      data: { ...updateData, version: { increment: 1 } },
    });

    // Log the change
    await logChange(model, 'update', session?.user?.id || 'unknown', id, { field, newValue: value });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Sheet Update Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { model, data } = await req.json();
    const prismaModel = modelMap[model];
    if (!prismaModel) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

    // Handle initial relation state for a new empty record
    const created = await prismaModel.create({
      data: data || {}
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = searchParams.get("id");

  if (!model || !id || !modelMap[model]) return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

  try {
    await modelMap[model].delete({ where: { id } });
    
    // Log the deletion
    await logChange(model, 'delete', session?.user?.id || 'unknown', id!, null);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
