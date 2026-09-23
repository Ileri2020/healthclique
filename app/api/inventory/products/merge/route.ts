import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sourceProductName, targetProductName } = body

    const source = typeof sourceProductName === "string" ? sourceProductName.trim() : ""
    const target = typeof targetProductName === "string" ? targetProductName.trim() : ""

    if (!source || !target) {
      return NextResponse.json({ error: "Source and target product names are required" }, { status: 400 })
    }

    if (source.toLowerCase() === target.toLowerCase()) {
      return NextResponse.json({ error: "Source and target product names must be different" }, { status: 400 })
    }

    const [stockRes, saleRes, countLineRes] = await Promise.all([
      prisma.inventoryStock.updateMany({
        where: { productName: source },
        data: { productName: target },
      }),
      prisma.inventorySale.updateMany({
        where: { productName: source },
        data: { productName: target },
      }),
      prisma.stockCountLine.updateMany({
        where: { productName: source },
        data: { productName: target },
      }),
    ])

    // Clean up old product shelf mapping if exists
    await prisma.productShelf.deleteMany({
      where: { productName: source },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      sourceProductName: source,
      targetProductName: target,
      updatedStocksCount: stockRes.count,
      updatedSalesCount: saleRes.count,
      updatedCountLinesCount: countLineRes.count,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to merge products" }, { status: 500 })
  }
}
