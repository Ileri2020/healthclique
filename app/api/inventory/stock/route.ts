import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const stockModel = (prisma as any).inventoryStock || (prisma as any).inventoryStockItem
    const inventoryStocks = stockModel
      ? await stockModel.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            productName: true,
            costPrice: true,
            packSalesPrice: true,
            pcsSalesPrice: true,
            carton: true,
            cartonQty: true,
            packsPerCarton: true,
            packQty: true,
            pcsQty: true,
            pcsCount: true,
            totalPcs: true,
          },
        })
      : []

    const latestByProduct = new Map<
      string,
      {
        productName: string
        costPrice?: number
        packSalesPrice?: number
        pcsSalesPrice?: number
        totalPcs?: number
      }
    >()

    inventoryStocks.forEach((stock: any) => {
      if (stock?.productName && !latestByProduct.has(stock.productName)) {
        latestByProduct.set(stock.productName, {
          productName: stock.productName,
          costPrice: stock.costPrice ?? undefined,
          packSalesPrice: stock.packSalesPrice ?? undefined,
          pcsSalesPrice: stock.pcsSalesPrice ?? undefined,
          totalPcs: stock.totalPcs ?? undefined,
        })
      }
    })

    return NextResponse.json(Array.from(latestByProduct.values()))
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 200 })
  }
}

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
          create: rows.map((row: any) => {
            const carton = Boolean(row.carton)
            const cartonQty = row.cartonQty === "" || row.cartonQty === undefined || row.cartonQty === null ? undefined : Number(row.cartonQty)
            const packsPerCarton = row.packsPerCarton === "" || row.packsPerCarton === undefined || row.packsPerCarton === null ? undefined : Number(row.packsPerCarton)
            const pack = Boolean(row.pack)
            const pcsCount = row.pcsCount === "" || row.pcsCount === undefined || row.pcsCount === null ? undefined : Number(row.pcsCount)
            const packQty = row.packQty === "" || row.packQty === undefined || row.packQty === null
              ? (row.qty === "" || row.qty === undefined || row.qty === null ? undefined : Number(row.qty))
              : Number(row.packQty)
            const pcsQty = row.pcsQty === "" || row.pcsQty === undefined || row.pcsQty === null ? undefined : Number(row.pcsQty)

            const cQty = cartonQty || 0
            const ppc = packsPerCarton || 1
            const pCount = pcsCount || 1
            const pkQty = packQty || 0
            const pcQty = pcsQty || 0

            let totalPcs = (cQty * ppc * pCount) + (pkQty * pCount) + pcQty
            if (!cQty && !pkQty && !pcQty) {
              totalPcs = 0
            }

            return {
              sn: row.sn === "" || row.sn === undefined ? undefined : Number(row.sn),
              productName: String(row.productName || ""),
              carton,
              cartonQty,
              packsPerCarton,
              pack,
              pcsCount,
              packQty,
              pcsQty,
              totalPcs,
              qty: packQty,
              costPrice: row.costPrice === "" || row.costPrice === undefined ? undefined : Number(row.costPrice),
              packSalesPrice: row.packSalesPrice === "" || row.packSalesPrice === undefined ? undefined : Number(row.packSalesPrice),
              pcsSalesPrice: row.pcsSalesPrice === "" || row.pcsSalesPrice === undefined ? undefined : Number(row.pcsSalesPrice),
              total: row.total === "" || row.total === undefined ? undefined : Number(row.total),
            }
          }),
        },
      },
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save stock" }, { status: 500 })
  }
}
