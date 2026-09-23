import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getCountProducts } from "@/lib/stock-counts"

async function requireAdmin() {
  const session = await auth()
  return session?.user?.role === "admin" ? session : null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const count = await prisma.stockCount.findUnique({ where: { id }, include: { shelf: true, lines: true } })
    if (!count) return NextResponse.json({ error: "Stock count not found" }, { status: 404 })
    const products = await getCountProducts()
    const productMap = new Map(products.map((product) => [product.productKey, product]))
    return NextResponse.json({
      ...count,
      lines: count.lines.map((line) => {
        const product = productMap.get(line.productName.replace(/\s+/g, " ").trim().toLowerCase())
        const difference = (line.countedPcs ?? line.expectedPcs) - line.expectedPcs
        return { ...line, packsPerCarton: product?.packsPerCarton ?? 0, pcsCount: product?.pcsCount ?? 0, difference }
      }),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load stock count" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action
    const count = await prisma.stockCount.findUnique({ where: { id }, include: { lines: true } })
    if (!count) return NextResponse.json({ error: "Stock count not found" }, { status: 404 })

    if (action === "expiry") {
      const expiry = body.expiry ? new Date(`${body.expiry}T00:00:00.000Z`) : null
      const line = await prisma.stockCountLine.update({ where: { id: String(body.lineId) }, data: { expiry } })
      return NextResponse.json(line)
    }

    const lineIds = action === "normalize-all"
      ? count.lines.map((line) => line.id)
      : [String(body.lineId)]
    if (!lineIds[0]) return NextResponse.json({ error: "Count line is required" }, { status: 400 })
    const now = new Date()
    const updates = await prisma.$transaction(lineIds.map((lineId) => {
      const line = count.lines.find((item) => item.id === lineId)
      if (!line) throw new Error("Count line not found")
      const normalizedPcs = line.countedPcs ?? line.expectedPcs
      return prisma.stockCountLine.update({ where: { id: lineId }, data: { normalizedPcs, normalizedAt: now, normalizedById: session.user?.id } })
    }))
    return NextResponse.json({ updated: updates.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to normalize stock count" }, { status: 500 })
  }
}
