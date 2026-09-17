import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const requestUrl = new URL(req.url)
    const history = requestUrl.searchParams.get("history")
    if (history === "true") {
      const date = requestUrl.searchParams.get("date")
      const from = requestUrl.searchParams.get("from")
      const to = requestUrl.searchParams.get("to")
      const start = from || date
      const end = to || date
      const inventories = await prisma.inventory.findMany({
        where: {
          type: "stock",
          ...(start && end ? {
            OR: [
              { date: { gte: new Date(`${start}T00:00:00.000Z`), lte: new Date(`${end}T23:59:59.999Z`) } },
              { rangeFrom: { lte: new Date(`${end}T23:59:59.999Z`) }, rangeTo: { gte: new Date(`${start}T00:00:00.000Z`) } },
            ],
          } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { stocks: true },
      })

      return NextResponse.json(inventories.map((inventory) => ({
        id: inventory.id,
        date: inventory.date,
        rangeFrom: inventory.rangeFrom,
        rangeTo: inventory.rangeTo,
        companyName: inventory.stocks[0]?.companyName ?? "",
        repName: inventory.stocks[0]?.repName ?? "",
        total: inventory.total,
        amountPaid: inventory.amountPaid,
        balance: Math.max(inventory.total - inventory.amountPaid, 0),
      })));
    }

    const stockModel = (prisma as any).inventoryStock || (prisma as any).inventoryStockItem
    const inventoryStocks = stockModel
      ? await stockModel.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            productName: true,
            costPrice: true,
            cartonCostPrice: true,
            packCostPrice: true,
            pcsCostPrice: true,
            packSalesPrice: true,
            pcsSalesPrice: true,
            cartonSalesPrice: true,
            wholesaleCartonSalesPrice: true,
            wholesalePackSalesPrice: true,
            wholesalePcsSalesPrice: true,
            carton: true,
            cartonQty: true,
            packsPerCarton: true,
            packQty: true,
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
        cartonCostPrice?: number
        packCostPrice?: number
        pcsCostPrice?: number
        packSalesPrice?: number
        pcsSalesPrice?: number
        cartonSalesPrice?: number
        wholesaleCartonSalesPrice?: number
        wholesalePackSalesPrice?: number
        wholesalePcsSalesPrice?: number
        totalPcs?: number
      }
    >()

    inventoryStocks.forEach((stock: any) => {
      if (stock?.productName && !latestByProduct.has(stock.productName)) {
        latestByProduct.set(stock.productName, {
          productName: stock.productName,
          costPrice: stock.costPrice ?? undefined,
          cartonCostPrice: stock.cartonCostPrice ?? undefined,
          packCostPrice: stock.packCostPrice ?? undefined,
          pcsCostPrice: stock.pcsCostPrice ?? undefined,
          packSalesPrice: stock.packSalesPrice ?? undefined,
          pcsSalesPrice: stock.pcsSalesPrice ?? undefined,
          cartonSalesPrice: stock.cartonSalesPrice ?? undefined,
          wholesaleCartonSalesPrice: stock.wholesaleCartonSalesPrice ?? undefined,
          wholesalePackSalesPrice: stock.wholesalePackSalesPrice ?? undefined,
          wholesalePcsSalesPrice: stock.wholesalePcsSalesPrice ?? undefined,
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

    const amountPaid = Number(body.amountPaid) || 0
    const total = rows.reduce((sum: number, row: any) => sum + (Number(row.costPrice) || 0), 0)
    const stock = await prisma.inventory.create({
      data: {
        type: "stock",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        total,
        amountPaid,
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
            const cQty = cartonQty || 0
            const ppc = packsPerCarton || 1
            const pCount = pcsCount || 1
            const pkQty = packQty || 0
            const costPrice = row.costPrice === "" || row.costPrice === undefined ? undefined : Number(row.costPrice)
            const totalPacks = (cQty * ppc) + pkQty
            const enteredTotalPcs = row.totalPcs === "" || row.totalPcs === undefined || row.totalPcs === null ? 0 : Number(row.totalPcs)
            const totalPieces = totalPacks > 0 ? totalPacks * pCount : enteredTotalPcs
            const costPerPack = costPrice !== undefined && totalPacks > 0 ? costPrice / totalPacks : undefined
            const costPerPiece = costPrice !== undefined && totalPieces > 0 ? costPrice / totalPieces : undefined
            const costPerCarton = costPerPack !== undefined && cQty > 0 ? costPerPack * ppc : undefined
            const retailMarkup = 1.3
            const wholesaleMarkup = 1.1
            const isWs = Boolean(row.wholesale)

            const rawRetailCarton = row.retailCartonSalesPrice !== "" && row.retailCartonSalesPrice !== undefined
              ? Number(row.retailCartonSalesPrice)
              : (!isWs && row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? Number(row.cartonSalesPrice) : undefined)

            const rawRetailPack = row.retailPackSalesPrice !== "" && row.retailPackSalesPrice !== undefined
              ? Number(row.retailPackSalesPrice)
              : (!isWs && row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? Number(row.packSalesPrice) : undefined)

            const rawRetailPcs = row.retailPcsSalesPrice !== "" && row.retailPcsSalesPrice !== undefined
              ? Number(row.retailPcsSalesPrice)
              : (!isWs && row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? Number(row.pcsSalesPrice) : undefined)

            const rawWholesaleCarton = row.wholesaleCartonSalesPrice !== "" && row.wholesaleCartonSalesPrice !== undefined
              ? Number(row.wholesaleCartonSalesPrice)
              : (isWs && row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? Number(row.cartonSalesPrice) : undefined)

            const rawWholesalePack = row.wholesalePackSalesPrice !== "" && row.wholesalePackSalesPrice !== undefined
              ? Number(row.wholesalePackSalesPrice)
              : (isWs && row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? Number(row.packSalesPrice) : undefined)

            const rawWholesalePcs = row.wholesalePcsSalesPrice !== "" && row.wholesalePcsSalesPrice !== undefined
              ? Number(row.wholesalePcsSalesPrice)
              : (isWs && row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? Number(row.pcsSalesPrice) : undefined)

            const cartonSalesPrice = rawRetailCarton ?? (costPerCarton !== undefined ? Number((costPerCarton * retailMarkup).toFixed(2)) : undefined)
            const finalPackSalesPrice = rawRetailPack ?? (costPerPack !== undefined ? Number((costPerPack * retailMarkup).toFixed(2)) : undefined)
            const finalPcsSalesPrice = rawRetailPcs ?? (costPerPiece !== undefined ? Number((costPerPiece * retailMarkup).toFixed(2)) : undefined)

            const wholesaleCartonSalesPrice = rawWholesaleCarton ?? (costPerCarton !== undefined ? Number((costPerCarton * wholesaleMarkup).toFixed(2)) : undefined)
            const wholesalePackSalesPrice = rawWholesalePack ?? (costPerPack !== undefined ? Number((costPerPack * wholesaleMarkup).toFixed(2)) : undefined)
            const wholesalePcsSalesPrice = rawWholesalePcs ?? (costPerPiece !== undefined ? Number((costPerPiece * wholesaleMarkup).toFixed(2)) : undefined)

            const totalPcs = totalPacks > 0 ? totalPacks * pCount : enteredTotalPcs

            return {
              sn: row.sn === "" || row.sn === undefined ? undefined : Number(row.sn),
              productName: String(row.productName || ""),
              companyName: body.companyName ? String(body.companyName) : undefined,
              repName: body.repName ? String(body.repName) : undefined,
              carton,
              cartonQty,
              packsPerCarton,
              pack,
              pcsCount,
              packQty,
              totalPcs,
              qty: packQty,
              costPrice,
              cartonCostPrice: costPerCarton !== undefined ? Number(costPerCarton.toFixed(2)) : undefined,
              packCostPrice: costPerPack !== undefined ? Number(costPerPack.toFixed(2)) : undefined,
              pcsCostPrice: costPerPiece !== undefined ? Number(costPerPiece.toFixed(2)) : undefined,
              cartonSalesPrice,
              packSalesPrice: finalPackSalesPrice,
              pcsSalesPrice: finalPcsSalesPrice,
              wholesaleCartonSalesPrice,
              wholesalePackSalesPrice,
              wholesalePcsSalesPrice,
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
