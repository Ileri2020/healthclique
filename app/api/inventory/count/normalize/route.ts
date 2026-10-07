import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    const body = await req.json()
    const { countId, lineId, normalizeAll } = body

    if (!countId || typeof countId !== "string") {
      return NextResponse.json({ error: "Stock count ID is required" }, { status: 400 })
    }

    const stockCount = await prisma.stockCount.findUnique({
      where: { id: countId },
      include: { lines: true },
    })

    if (!stockCount) {
      return NextResponse.json({ error: "Stock count session not found" }, { status: 404 })
    }

    const now = new Date()

    if (normalizeAll) {
      // Normalize all lines in session
      await Promise.all(
        stockCount.lines.filter((line) => line.countedPcs != null).map(async (line) => {
          const approvedCount = Number(line.countedPcs) <= 0 ? 0 : Number(line.countedPcs)
          await prisma.stockCountLine.update({
            where: { id: line.id },
            data: {
              normalizedPcs: approvedCount,
              normalizedAt: now,
              normalizedById: session.user?.id,
            },
          })
        })
      )

      await prisma.stockCount.update({
        where: { id: countId },
        data: {
          normalized: true,
          normalizedAt: now,
        },
      })

      return NextResponse.json({ success: true, message: "All product counts normalized successfully" })
    }

    if (lineId) {
      const line = stockCount.lines.find((l) => l.id === lineId)
      if (!line) {
        return NextResponse.json({ error: "Line not found" }, { status: 404 })
      }
      if (line.countedPcs == null) return NextResponse.json({ error: "This product was not counted" }, { status: 400 })

      const approvedCount = Number(line.countedPcs) <= 0 ? 0 : Number(line.countedPcs)

      const updatedLine = await prisma.stockCountLine.update({
        where: { id: lineId },
        data: {
          normalizedPcs: approvedCount,
          normalizedAt: now,
          normalizedById: session.user?.id,
        },
      })

      return NextResponse.json({ success: true, line: updatedLine })
    }

    return NextResponse.json({ error: "Specify lineId or set normalizeAll to true" }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to normalize stock counts" }, { status: 500 })
  }
}
