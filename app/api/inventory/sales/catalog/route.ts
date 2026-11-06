import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type CatalogPricing = {
  costPrice?: number
  pcsCostPrice?: number
  cartonSalesPrice?: number
  packSalesPrice?: number
  pcsSalesPrice?: number
  wholesaleCartonSalesPrice?: number
  wholesalePackSalesPrice?: number
  wholesalePcsSalesPrice?: number
  packsPerCarton?: number
  pcsCount?: number
  cheapestRecentPcsCostPrice?: number
  recentPcsCostPrices?: number[]
}

export async function GET() {
  try {
    const [inventoryStocks, inventorySales] = await Promise.all([
      prisma.inventoryStock.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          productName: true,
          carton: true,
          costPrice: true,
          pcsCostPrice: true,
          totalPcs: true,
          pack: true,
          expiry: true,
          cartonQty: true,
          packsPerCarton: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          cartonSalesPrice: true,
          packSalesPrice: true,
          pcsSalesPrice: true,
          wholesaleCartonSalesPrice: true,
          wholesalePackSalesPrice: true,
          wholesalePcsSalesPrice: true,
        },
      }),
      prisma.inventorySale.findMany({ select: { productName: true } }),
    ])

    const productNames = Array.from(new Set(
      [...inventoryStocks, ...inventorySales]
        .map((item) => item.productName?.trim())
        .filter((name): name is string => Boolean(name)),
    )).sort((a, b) => a.localeCompare(b))

    const stockPricing: Record<string, CatalogPricing> = {}
    const recentCostsByProduct = new Map<string, number[]>()
    const recentEntriesSeenByProduct = new Map<string, number>()

    // Rows are newest first. Keep current selling prices and packaging from the latest
    // stock row, and separately inspect at most the latest three rows for unit cost.
    for (const stock of inventoryStocks) {
      const key = stock.productName.trim().toLowerCase()
      if (!key) continue

      if (!stockPricing[key]) {
        stockPricing[key] = {
          costPrice: stock.costPrice ?? undefined,
          pcsCostPrice: stock.pcsCostPrice ?? undefined,
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

      const entriesSeen = recentEntriesSeenByProduct.get(key) ?? 0
      if (entriesSeen >= 3) continue
      recentEntriesSeenByProduct.set(key, entriesSeen + 1)

      const totalPcs = Number(stock.totalPcs) > 0
        ? Number(stock.totalPcs)
        : (Number(stock.cartonQty) || 0) * (Number(stock.packsPerCarton) || 1) * (Number(stock.pcsCount) || 1)
          + (Number(stock.packQty) || 0) * (Number(stock.pcsCount) || 1)
          + (Number(stock.pcsQty) || 0)
      const costPerPiece = Number(stock.pcsCostPrice) > 0
        ? Number(stock.pcsCostPrice)
        : Number(stock.costPrice) > 0 && totalPcs > 0
          ? Number(stock.costPrice) / totalPcs
          : 0

      if (costPerPiece > 0 && Number.isFinite(costPerPiece)) {
        const recentCosts = recentCostsByProduct.get(key) ?? []
        recentCosts.push(Number(costPerPiece.toFixed(2)))
        recentCostsByProduct.set(key, recentCosts)
      }
    }

    for (const [key, recentPcsCostPrices] of recentCostsByProduct) {
      stockPricing[key].recentPcsCostPrices = recentPcsCostPrices
      stockPricing[key].cheapestRecentPcsCostPrice = Math.min(...recentPcsCostPrices)
    }

    const stockRows = inventoryStocks.map((stock) => ({
      productName: stock.productName,
      carton: stock.carton,
      cartonQty: stock.cartonQty,
      packsPerCarton: stock.packsPerCarton,
      pack: stock.pack,
      packQty: stock.packQty,
      pcsCount: stock.pcsCount,
      pcsQty: stock.pcsQty,
      totalPcs: stock.totalPcs,
      pcsSalesPrice: stock.pcsSalesPrice,
      packSalesPrice: stock.packSalesPrice,
      cartonSalesPrice: stock.cartonSalesPrice,
      expiry: stock.expiry?.toISOString() ?? null,
    }))
    return NextResponse.json({ productNames, stockPricing, stockRows, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Unable to load sales product catalog", error)
    return NextResponse.json({ error: "Unable to get products and prices from the database" }, { status: 500 })
  }
}
