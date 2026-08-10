import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, rows } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 })
    }

    const stock = await prisma.inventory.create({
      data: {
        type: "stock",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        stocks: {
          create: rows.map((row: any) => ({
            sn: row.sn === "" ? undefined : Number(row.sn),
            productName: String(row.productName || ""),
            pack: Boolean(row.pack),
            pcsCount: row.pcsCount === "" ? undefined : Number(row.pcsCount),
            costPrice: row.costPrice === "" ? undefined : Number(row.costPrice),
            total: row.total === "" ? undefined : Number(row.total),
          })),
        },
      },
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save stock" }, { status: 500 })
  }
}
