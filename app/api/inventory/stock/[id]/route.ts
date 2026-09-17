import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
  }
  const inventory = await prisma.inventory.findUnique({ where: { id }, include: { stocks: true } })
  if (!inventory) return NextResponse.json({ error: "Stock purchase not found" }, { status: 404 })
  return NextResponse.json(inventory)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
    }
    const body = await request.json()
    const rows = Array.isArray(body.rows) ? body.rows : []
    const amountPaid = Number(body.amountPaid) || 0
    const total = rows.reduce((sum: number, row: any) => sum + (Number(row.costPrice) || 0), 0)
    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        date: body.date?.date ? new Date(body.date.date) : undefined,
        total,
        amountPaid,
        stocks: {
          deleteMany: {},
          create: rows.map((row: any) => ({
            sn: row.sn === "" ? undefined : Number(row.sn), productName: String(row.productName || ""),
            companyName: body.companyName ? String(body.companyName) : undefined, repName: body.repName ? String(body.repName) : undefined,
            carton: Boolean(row.carton), cartonQty: row.cartonQty === "" ? undefined : Number(row.cartonQty),
            packsPerCarton: row.packsPerCarton === "" ? undefined : Number(row.packsPerCarton), pack: Boolean(row.pack),
            pcsCount: row.pcsCount === "" ? undefined : Number(row.pcsCount), packQty: row.packQty === "" ? undefined : Number(row.packQty),
            totalPcs: Number(row.totalPcs) || 0, qty: row.packQty === "" ? undefined : Number(row.packQty), costPrice: Number(row.costPrice) || undefined,
            cartonCostPrice: Number(row.cartonCostPrice) || undefined, packCostPrice: Number(row.packCostPrice) || undefined, pcsCostPrice: Number(row.pcsCostPrice) || undefined,
            cartonSalesPrice: Number(row.wholesale ? (row.retailCartonSalesPrice || undefined) : (row.cartonSalesPrice || row.retailCartonSalesPrice || undefined)) || undefined,
            packSalesPrice: Number(row.wholesale ? (row.retailPackSalesPrice || undefined) : (row.packSalesPrice || row.retailPackSalesPrice || undefined)) || undefined,
            pcsSalesPrice: Number(row.wholesale ? (row.retailPcsSalesPrice || undefined) : (row.pcsSalesPrice || row.retailPcsSalesPrice || undefined)) || undefined,
            wholesaleCartonSalesPrice: Number(row.wholesale ? (row.cartonSalesPrice || row.wholesaleCartonSalesPrice || undefined) : (row.wholesaleCartonSalesPrice || undefined)) || undefined,
            wholesalePackSalesPrice: Number(row.wholesale ? (row.packSalesPrice || row.wholesalePackSalesPrice || undefined) : (row.wholesalePackSalesPrice || undefined)) || undefined,
            wholesalePcsSalesPrice: Number(row.wholesale ? (row.pcsSalesPrice || row.wholesalePcsSalesPrice || undefined) : (row.wholesalePcsSalesPrice || undefined)) || undefined,
          })),
        },
      },
      include: { stocks: true },
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update stock" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
    }

    const existing = await prisma.inventory.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: "Stock purchase not found" }, { status: 404 })

    await prisma.inventoryStock.deleteMany({ where: { inventoryId: id } })
    await prisma.inventory.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to delete stock purchase" }, { status: 500 })
  }
}