import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalNumber = (value: unknown) => value === "" || value == null ? undefined : Number(value)

export async function POST(request: Request) {
  try {
    const { date, rows } = await request.json()
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "No rows provided" }, { status: 400 })
    const inventory = await prisma.inventory.create({
      data: {
        type: "sale",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        sales: { create: rows.map((row) => ({
          sn: optionalNumber(row.sn) as number | undefined, customerSn: optionalNumber(row.customerSn) as number | undefined,
          productName: String(row.productName || ""), pack: Boolean(row.pack), pcsCount: optionalNumber(row.pcsCount) as number | undefined,
          packQty: optionalNumber(row.packQty) as number | undefined, pcsQty: optionalNumber(row.pcsQty) as number | undefined,
          totalPcs: optionalNumber(row.totalPcs) as number | undefined, costPrice: optionalNumber(row.costPrice) as number | undefined,
          packSalesPrice: optionalNumber(row.packSalesPrice) as number | undefined, pcsSalesPrice: optionalNumber(row.pcsSalesPrice) as number | undefined,
          price: optionalNumber(row.price) as number | undefined, total: optionalNumber(row.total) as number | undefined,
        })) },
      },
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save sales" }, { status: 500 })
  }
}