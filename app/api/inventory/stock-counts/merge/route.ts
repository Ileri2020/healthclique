import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  try {
    const body = await request.json()
    const source = String(body.sourceProductName || "").trim()
    const target = String(body.targetProductName || "").trim()
    if (!source || !target || source.toLowerCase() === target.toLowerCase()) {
      return NextResponse.json({ error: "Two different product names are required" }, { status: 400 })
    }
    const [stocks, sales, countLines] = await prisma.$transaction([
      prisma.inventoryStock.updateMany({ where: { productName: source }, data: { productName: target } }),
      prisma.inventorySale.updateMany({ where: { productName: source }, data: { productName: target } }),
      prisma.stockCountLine.updateMany({ where: { productName: source }, data: { productName: target } }),
    ])
    return NextResponse.json({ stocks: stocks.count, sales: sales.count, countLines: countLines.count })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to merge products" }, { status: 500 })
  }
}
