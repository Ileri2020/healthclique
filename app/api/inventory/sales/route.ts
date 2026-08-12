import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, rows } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 })
    }

    const sales = await prisma.inventory.create({
      data: {
        type: "sale",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        sales: {
          create: rows.map((row: any) => ({
            sn: row.sn === "" ? undefined : Number(row.sn),
            customerSn: row.customerSn === "" ? undefined : Number(row.customerSn),
            productName: String(row.productName || ""),
            pack: Boolean(row.pack),
            pcsCount: row.pcsCount === "" ? undefined : Number(row.pcsCount),
            qty: row.qty === "" ? undefined : Number(row.qty),
            costPrice: row.costPrice === "" ? undefined : Number(row.costPrice),
            packSalesPrice: row.packSalesPrice === "" ? undefined : Number(row.packSalesPrice),
            pcsSalesPrice: row.pcsSalesPrice === "" ? undefined : Number(row.pcsSalesPrice),
            price: row.price === "" ? undefined : Number(row.price),
            total: row.total === "" ? undefined : Number(row.total),
          })),
        },
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save sales" }, { status: 500 })
  }
}
