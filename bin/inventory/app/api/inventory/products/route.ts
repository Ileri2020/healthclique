import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const stocks = await prisma.inventoryStock.findMany({ select: { productName: true } })
    const names = [...new Set(stocks.map((stock) => stock.productName.trim()).filter(Boolean))].sort()
    return NextResponse.json(names)
  } catch {
    return NextResponse.json([])
  }
}