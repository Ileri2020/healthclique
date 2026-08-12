import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const stockModel = (prisma as any).inventoryStock || (prisma as any).inventoryStockItem
    const inventoryStocks = stockModel ? await stockModel.findMany({ select: { productName: true } }) : []

    const names = Array.from(
      new Set(
        inventoryStocks
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
