import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [inventoryStocks, inventorySales] = await Promise.all([
      prisma.inventoryStock.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          productName: true,
          costPrice: true,
          cartonSalesPrice: true,
          packSalesPrice: true,
          pcsSalesPrice: true,
          wholesaleCartonSalesPrice: true,
          wholesalePackSalesPrice: true,
          wholesalePcsSalesPrice: true,
          packsPerCarton: true,
          pcsCount: true,
        },
      }),
      prisma.inventorySale.findMany({ select: { productName: true } }),
    ])

    const productNames = Array.from(new Set(
      [...inventoryStocks, ...inventorySales]
        .map((item) => item.productName?.trim())
        .filter((name): name is string => Boolean(name)),
    )).sort((a, b) => a.localeCompare(b))

    const stockPricing: Record<string, {
      costPrice?: number
      cartonSalesPrice?: number
      packSalesPrice?: number
      pcsSalesPrice?: number
      wholesaleCartonSalesPrice?: number
      wholesalePackSalesPrice?: number
      wholesalePcsSalesPrice?: number
      packsPerCarton?: number
      pcsCount?: number
    }> = {}

    for (const stock of inventoryStocks) {
      const key = stock.productName.trim().toLowerCase()
      if (!key || stockPricing[key]) continue
      stockPricing[key] = {
        costPrice: stock.costPrice ?? undefined,
        cartonSalesPrice: stock.cartonSalesPrice ?? undefined,
        packSalesPrice: stock.packSalesPrice ?? undefined,
        pcsSalesPrice: stock.pcsSalesPrice ?? undefined,
        wholesaleCartonSalesPrice: stock.wholesaleCartonSalesPrice ?? undefined,
        wholesalePackSalesPrice: stock.wholesalePackSalesPrice ?? undefined,
        wholesalePcsSalesPrice: stock.wholesalePcsSalesPrice ?? undefined,
        packsPerCarton: stock.packsPerCarton ?? undefined,
        pcsCount: stock.pcsCount ?? undefined,
      }
    }

    return NextResponse.json({ productNames, stockPricing, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Unable to load sales product catalog", error)
    return NextResponse.json({ error: "Unable to get products and prices from the database" }, { status: 500 })
  }
}