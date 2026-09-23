import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
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
        stockCount.lines.map(async (line) => {
          const approvedCount = line.countedPcs ?? line.expectedPcs
          await prisma.stockCountLine.update({
            where: { id: line.id },
            data: {
              normalizedPcs: approvedCount,
              normalizedAt: now,
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

      const approvedCount = line.countedPcs ?? line.expectedPcs

      const updatedLine = await prisma.stockCountLine.update({
        where: { id: lineId },
        data: {
          normalizedPcs: approvedCount,
          normalizedAt: now,
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
