import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const history = searchParams.get("history")
    const date = searchParams.get("date")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const countId = searchParams.get("id")

    if (countId) {
      const single = await prisma.stockCount.findUnique({
        where: { id: countId },
        include: { lines: true, shelf: true },
      })
      if (!single) return NextResponse.json({ error: "Stock count not found" }, { status: 404 })
      return NextResponse.json(single)
    }

    if (history === "true") {
      const counts = await prisma.stockCount.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          date: true,
          shelfName: true,
          normalized: true,
          normalizedAt: true,
          createdAt: true,
          _count: { select: { lines: true } },
        },
      })
      return NextResponse.json(counts)
    }

    const start = from || date
    const end = to || date

    const whereCondition = start && end ? {
      date: {
        gte: new Date(`${start}T00:00:00.000Z`),
        lte: new Date(`${end}T23:59:59.999Z`),
      },
    } : {}

    const stockCounts = await prisma.stockCount.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        lines: true,
        shelf: true,
      },
    })

    return NextResponse.json(stockCounts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load count history" }, { status: 500 })
  }
}
