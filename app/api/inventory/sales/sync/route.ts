import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalNumber = (value: unknown) => value === "" || value == null ? undefined : Number(value)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const localSaleId = typeof body.localSaleId === "string" ? body.localSaleId : ""
    const sections = Array.isArray(body.sections)
      ? body.sections.filter((section: any) => Array.isArray(section.rows) && section.rows.length > 0)
      : []
    if (!localSaleId || !sections.length) {
      return NextResponse.json({ error: "A local sale ID and at least one sale row are required" }, { status: 400 })
    }

    const synced = []
    for (const [index, section] of sections.entries()) {
      const localSyncId = `${localSaleId}:${index}`
      const existing = await prisma.inventory.findUnique({ where: { localSyncId }, select: { id: true } })
      if (existing) {
        synced.push({ id: existing.id, alreadySynced: true })
        continue
      }

      const date = body.date
      const inventory = await prisma.inventory.create({
        data: {
          type: "sale",
          localSyncId,
          staffName: String(body.staffName || "Local Staff").trim(),
          date: date?.date ? new Date(date.date) : undefined,
          rangeFrom: date?.from ? new Date(date.from) : undefined,
          rangeTo: date?.to ? new Date(date.to) : undefined,
          paymentMethod: section.paymentMethod || undefined,
          cashPaid: section.cashPaid === undefined ? undefined : Number(section.cashPaid),
          posPayment: section.posPayment === undefined ? undefined : Number(section.posPayment),
          change: section.change === undefined ? undefined : Number(section.change),
          sales: {
            create: section.rows.map((row: any) => ({
              sn: optionalNumber(row.sn),
              customerSn: optionalNumber(row.customerSn),
              customerName: String(row.customerName || section.customerName || "") || undefined,
              productName: String(row.productName || ""),
              carton: Boolean(row.carton),
              cartonQty: optionalNumber(row.cartonQty),
              packsPerCarton: optionalNumber(row.packsPerCarton),
              pack: Boolean(row.pack),
              wholesale: Boolean(row.wholesale),
              pcsCount: optionalNumber(row.pcsCount),
              packQty: optionalNumber(row.packQty),
              pcsQty: optionalNumber(row.pcsQty),
              totalPcs: optionalNumber(row.totalPcs),
              qty: optionalNumber(row.qty),
              costPrice: optionalNumber(row.costPrice),
              packSalesPrice: optionalNumber(row.salesPrice),
              pcsSalesPrice: optionalNumber(row.salesPrice),
              price: optionalNumber(row.salesPrice),
              total: optionalNumber(row.total),
            })),
          },
        },
        select: { id: true },
      })
      synced.push({ id: inventory.id, alreadySynced: false })
    }

    return NextResponse.json({ synced })
  } catch (error) {
    console.error("Local sales sync failed", error)
    return NextResponse.json({ error: "Unable to sync local sales" }, { status: 500 })
  }
}