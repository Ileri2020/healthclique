import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getCountProducts } from "@/lib/stock-counts"

async function requireAdmin() {
  const session = await auth()
  return session?.user?.role === "admin" ? session : null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    if (url.searchParams.get("mode") === "products") {
      const [products, shelves] = await Promise.all([getCountProducts(), prisma.shelf.findMany({ orderBy: [{ number: "asc" }, { name: "asc" }] })])
      return NextResponse.json({ products, shelves })
    }

    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const counts = await prisma.stockCount.findMany({
      where: from || to ? { date: { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) } } : undefined,
      orderBy: { date: "desc" },
      include: { shelf: true, lines: true },
    })
    return NextResponse.json(counts.map((count) => ({
      ...count,
      totalLines: count.lines.length,
      countedLines: count.lines.filter((line) => line.countedPcs != null).length,
    })))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load stock counts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  try {
    const body = await request.json()
    const date = body.date ? new Date(`${body.date}T00:00:00.000Z`) : new Date()
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Invalid count date" }, { status: 400 })
    const rows = Array.isArray(body.rows) ? body.rows.filter((row: any) => String(row.productName || "").trim()) : []
    if (!rows.length) return NextResponse.json({ error: "No count rows provided" }, { status: 400 })
    const products = await getCountProducts()
    const productMap = new Map(products.map((product) => [product.productKey, product]))

    const count = await prisma.stockCount.create({
      data: {
        date,
        shelfId: body.shelfId || undefined,
        createdById: session.user?.id,
        lines: {
          create: rows.map((row: any) => {
            const product = productMap.get(String(row.productKey || row.productName).replace(/\s+/g, " ").trim().toLowerCase())
            const expiry = row.expiry ? new Date(`${row.expiry}T00:00:00.000Z`) : product?.expiry ?? undefined
            return {
              productName: String(row.productName).trim(),
              expectedPcs: product?.expectedPcs ?? (Number(row.expectedPcs) || 0),
              countedPcs: row.countedPcs === "" || row.countedPcs == null ? undefined : Number(row.countedPcs),
              expiry,
            }
          }),
        },
      },
      include: { shelf: true, lines: true },
    })
    return NextResponse.json(count)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save stock count" }, { status: 500 })
  }
}
