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
            pcsQty: row.pcsQty === "" ? undefined : Number(row.pcsQty),
            totalPcs: Number(row.totalPcs) || 0, qty: row.packQty === "" ? undefined : Number(row.packQty), costPrice: Number(row.costPrice) || undefined,
            cartonCostPrice: Number(row.cartonCostPrice) || undefined, packCostPrice: Number(row.packCostPrice) || undefined, pcsCostPrice: Number(row.pcsCostPrice) || undefined,
            cartonSalesPrice: Number(row.retailCartonSalesPrice || (!row.wholesale ? row.cartonSalesPrice : undefined) || undefined) || undefined,
            packSalesPrice: Number(row.retailPackSalesPrice || (!row.wholesale ? row.packSalesPrice : undefined) || undefined) || undefined,
            pcsSalesPrice: Number(row.retailPcsSalesPrice || (!row.wholesale ? row.pcsSalesPrice : undefined) || undefined) || undefined,
            wholesaleCartonSalesPrice: Number(row.wholesaleCartonSalesPrice || (row.wholesale ? row.cartonSalesPrice : undefined) || undefined) || undefined,
            wholesalePackSalesPrice: Number(row.wholesalePackSalesPrice || (row.wholesale ? row.packSalesPrice : undefined) || undefined) || undefined,
            wholesalePcsSalesPrice: Number(row.wholesalePcsSalesPrice || (row.wholesale ? row.pcsSalesPrice : undefined) || undefined) || undefined,
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