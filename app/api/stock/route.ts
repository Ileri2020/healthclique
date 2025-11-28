import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// -----------------------------------------
// GET → fetch stock metrics for ALL products
// -----------------------------------------
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
        cartItems: true,
      },
    });

    const metrics = products.map((p) => {
      // SUM ALL STOCK ENTRIES
      const totalStock = p.stock.reduce((sum, s) => sum + s.addedQuantity, 0);

      // SUM ALL SOLD ENTRIES
      const totalSold = p.cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const available = totalStock - totalSold;

      const profit = totalSold * p.price;

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        totalStock,
        totalSold,
        available,
        profit,
      };
    });

    return NextResponse.json(metrics);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch metrics" });
  }
}

// -------------------------------------------------
// POST → Add NEW stock entry to a product
// -------------------------------------------------
export async function POST(req: Request) {
  const { productId, addedQuantity } = await req.json();

  if (!productId || !addedQuantity) {
    return NextResponse.json(
      { error: "productId and amount are required" },
      { status: 400 }
    );
  }

  try {
      console.log("Data to create :", productId, addedQuantity);
  
      const stock = await prisma.stock.create({
            data: { productId, addedQuantity },
        });
      return new Response(JSON.stringify(stock), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      // console.error('Database POST error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create item' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// -------------------------------------------------
// PUT → Edit existing stock record
// -------------------------------------------------
export async function PUT(req: Request) {
  const { stockId, addedQuantity } = await req.json();

  if (!stockId) {
    return NextResponse.json(
      { error: "stockId is required" },
      { status: 400 }
    );
  }

  const updated = await prisma.stock.update({
    where: { id: stockId },
    data: { addedQuantity },
  });

  return NextResponse.json(updated);
}

// -------------------------------------------------
// DELETE → Remove a stock entry
// -------------------------------------------------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const stockId = searchParams.get("stockId");

  if (!stockId) {
    return NextResponse.json(
      { error: "stockId is required" },
      { status: 400 }
    );
  }

  const deleted = await prisma.stock.delete({
    where: { id: stockId },
  });

  return NextResponse.json(deleted);
}
