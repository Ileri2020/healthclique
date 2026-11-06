import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalNumber = (value: unknown) => value === "" || value == null ? undefined : Number(value)

export async function GET() {
  try {
    const stocks = await prisma.inventoryStock.findMany({ orderBy: { createdAt: "desc" } })
    const latest = new Map<string, (typeof stocks)[number]>()
    stocks.forEach((stock) => { if (!latest.has(stock.productName)) latest.set(stock.productName, stock) })
    return NextResponse.json([...latest.values()])
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const { date, rows } = await request.json()
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "No rows provided" }, { status: 400 })

    const inventory = await prisma.inventory.create({
      data: {
        type: "stock",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        stocks: { create: rows.map((row) => {
          const cartonQty = optionalNumber(row.cartonQty) as number | undefined
          const packsPerCarton = optionalNumber(row.packsPerCarton) as number | undefined
          const pcsCount = optionalNumber(row.pcsCount) as number | undefined
          const packQty = optionalNumber(row.packQty ?? row.qty) as number | undefined
          const pcsQty = optionalNumber(row.pcsQty) as number | undefined
          const totalPcs = (cartonQty || 0) * (packsPerCarton || 1) * (pcsCount || 1) + (packQty || 0) * (pcsCount || 1) + (pcsQty || 0)
          return {
            sn: optionalNumber(row.sn) as number | undefined, productName: String(row.productName || ""),
            carton: Boolean(row.carton), cartonQty, packsPerCarton, pack: Boolean(row.pack), pcsCount, packQty, pcsQty,
            totalPcs, costPrice: optionalNumber(row.costPrice) as number | undefined,
            packSalesPrice: optionalNumber(row.packSalesPrice) as number | undefined,
            pcsSalesPrice: optionalNumber(row.pcsSalesPrice) as number | undefined,
            total: optionalNumber(row.total) as number | undefined,
          }
        }) },
      },
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save stock" }, { status: 500 })
  }
}