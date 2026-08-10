import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const inventoryItems = await prisma.inventory.findMany({
      where: { type: "stock" },
      include: { stocks: true },
    })

    const names = new Set<string>()
    inventoryItems.forEach((item) => {
      item.stocks.forEach((stock) => {
        if (typeof stock.productName === "string" && stock.productName.trim()) {
          names.add(stock.productName.trim())
        }
      })
    })

    return NextResponse.json(Array.from(names).sort())
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to fetch products" }, { status: 500 })
  }
}
