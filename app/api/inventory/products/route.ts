import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const withPrices = searchParams.get("withPrices") === "true"

    const [inventoryStocks, inventorySales, catalogProducts] = await Promise.all([
      prisma.inventoryStock.findMany({ select: { productName: true } }),
      prisma.inventorySale.findMany({ select: { productName: true, price: true } }),
      withPrices ? prisma.product.findMany({ select: { name: true, price: true } }) : Promise.resolve([]),
    ])

    if (withPrices) {
      const nameMap = new Map<string, { name: string; price?: number }>()

      for (const p of catalogProducts) {
        if (p.name?.trim()) {
          nameMap.set(p.name.trim().toLowerCase(), { name: p.name.trim(), price: p.price })
        }
      }
      for (const s of inventorySales) {
        if (s.productName?.trim()) {
          const key = s.productName.trim().toLowerCase()
          if (!nameMap.has(key)) {
            nameMap.set(key, { name: s.productName.trim(), price: s.price ?? undefined })
          } else if (s.price != null && !nameMap.get(key)!.price) {
            nameMap.get(key)!.price = s.price
          }
        }
      }
      for (const st of inventoryStocks) {
        if (st.productName?.trim()) {
          const key = st.productName.trim().toLowerCase()
          if (!nameMap.has(key)) {
            nameMap.set(key, { name: st.productName.trim() })
          }
        }
      }

      const list = Array.from(nameMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      return NextResponse.json(list)
    }

    const names = Array.from(
      new Set(
        [...inventoryStocks, ...inventorySales]
          .map((stock: any) => stock?.productName)
          .filter((name: any): name is string => typeof name === "string" && name.trim().length > 0)
      )
    ).sort()

    return NextResponse.json(names)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 200 })
  }
}
