import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid products list" }, { status: 400 });
    }

    const results = await Promise.all(
      products.map(async (item: { name: string; quantity: number | string; grams?: string }) => {
        // Try exact match first
        let product = await prisma.product.findFirst({
          where: {
            name: {
              equals: item.name.trim(),
              mode: "insensitive",
            },
          },
          include: {
            category: true,
            stock: true,
          }
        });

        // If not found, try a partial match
        if (!product) {
          product = await prisma.product.findFirst({
            where: {
              name: {
                contains: item.name.trim(),
                mode: "insensitive",
              },
            },
            include: {
              category: true,
              stock: true,
            }
          });
        }

        if (product) {
          return {
            ...product,
            requestedQuantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity,
            requestedGrams: item.grams
          };
        }
        return null;
      })
    );

    const foundProducts = results.filter((p) => p !== null);

    return NextResponse.json({ products: foundProducts });
  } catch (error) {
    console.error("Batch search error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
