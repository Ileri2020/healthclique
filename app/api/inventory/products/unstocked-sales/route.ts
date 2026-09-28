import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase()
const piecesOf = (row: any) => Number(row.totalPcs ?? row.qty ?? (
  (Number(row.cartonQty) || 0) * (Number(row.packsPerCarton) || 1) * (Number(row.pcsCount) || 1) +
  (Number(row.packQty) || 0) * (Number(row.pcsCount) || 1) +
  (Number(row.pcsQty) || 0)
))

const saleMode = (sale: any): "carton" | "pack" | "pcs" => sale.carton ? "carton" : sale.pack ? "pack" : "pcs"

const modeQuantity = (sale: any, mode: "carton" | "pack" | "pcs") => {
  const cartons = Number(sale.cartonQty) || 0
  const packs = Number(sale.packQty) || 0
  const pieces = Number(sale.pcsQty) || 0
  const packsPerCarton = Number(sale.packsPerCarton) || 1
  const piecesPerPack = Number(sale.pcsCount) || 1
  if (mode === "carton") return cartons + packs / packsPerCarton + pieces / (packsPerCarton * piecesPerPack)
  if (mode === "pack") return cartons * packsPerCarton + packs + pieces / piecesPerPack
  return piecesOf(sale)
}

const costsForStock = (stock: any) => {
  const totalPieces = piecesOf(stock)
  const pcsCost = Number(stock.pcsCostPrice) > 0
    ? Number(stock.pcsCostPrice)
    : Number(stock.costPrice) > 0 && totalPieces > 0
      ? Number(stock.costPrice) / totalPieces
      : null
  const packCost = Number(stock.packCostPrice) > 0
    ? Number(stock.packCostPrice)
    : pcsCost != null && Number(stock.pcsCount) > 0
      ? pcsCost * Number(stock.pcsCount)
      : null
  const cartonCost = Number(stock.cartonCostPrice) > 0
    ? Number(stock.cartonCostPrice)
    : packCost != null && Number(stock.packsPerCarton) > 0
      ? packCost * Number(stock.packsPerCarton)
      : null
  return { pcs: pcsCost, pack: packCost, carton: cartonCost }
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const from = params.get("from")
    const to = params.get("to")
    const hasRange = Boolean(from && to)
    const rangeStart = from ? new Date(`${from}T00:00:00.000Z`) : undefined
    const rangeEnd = to ? new Date(`${to}T23:59:59.999Z`) : undefined
    if (hasRange && (Number.isNaN(rangeStart?.getTime()) || Number.isNaN(rangeEnd?.getTime()) || rangeStart! > rangeEnd!)) {
      return NextResponse.json({ error: "The date range is invalid." }, { status: 400 })
    }

    const [stocks, inventories] = await Promise.all([
      prisma.inventory.findMany({
        where: { type: "stock" },
        select: {
          date: true,
          createdAt: true,
          stocks: {
            select: {
              productName: true,
              costPrice: true,
              cartonCostPrice: true,
              packCostPrice: true,
              pcsCostPrice: true,
              totalPcs: true,
              qty: true,
              cartonQty: true,
              packsPerCarton: true,
              packQty: true,
              pcsCount: true,
              pcsQty: true,
            },
          },
        },
      }),
      prisma.inventory.findMany({
        where: {
          type: "sale",
          ...(hasRange ? {
            OR: [
              { date: { gte: rangeStart, lte: rangeEnd } },
              { rangeFrom: { lte: rangeEnd }, rangeTo: { gte: rangeStart } },
            ],
          } : {}),
        },
        orderBy: { date: "desc" },
        include: { sales: true },
      }),
    ])

    const stockedNames = stocks.flatMap((inventory) => inventory.stocks.map((stock) => String(stock.productName ?? "").trim())).filter((name) => name.length > 0)
    const stockedProducts = [...new Set<string>(stockedNames)]
      .sort((left, right) => left.localeCompare(right))
    const stockedNameSet = new Set(stockedProducts.map(normalize))
    const stockHistory = new Map<string, Array<{ date: Date; costs: ReturnType<typeof costsForStock> }>>()
    for (const inventory of stocks) {
      const stockDate = inventory.date ?? inventory.createdAt
      for (const stock of inventory.stocks) {
        const key = normalize(stock.productName)
        if (!key) continue
        const history = stockHistory.get(key) ?? []
        history.push({ date: stockDate, costs: costsForStock(stock) })
        stockHistory.set(key, history)
      }
    }
    stockHistory.forEach((history) => history.sort((left, right) => left.date.getTime() - right.date.getTime()))

    const rows = inventories.flatMap((inventory) => inventory.sales
      .filter((sale) => sale.productName.trim() && !stockedNameSet.has(normalize(sale.productName)))
      .map((sale) => ({
        id: sale.id,
        saleId: inventory.id,
        date: inventory.date,
        rangeFrom: inventory.rangeFrom,
        rangeTo: inventory.rangeTo,
        customerSn: sale.customerSn,
        productName: sale.productName,
        quantity: sale.totalPcs ?? sale.qty ?? sale.pcsQty ?? 0,
        amount: sale.total ?? 0,
      })))

    const lossRows = inventories.flatMap((inventory) => inventory.sales.flatMap((sale) => {
      const key = normalize(sale.productName)
      if (!key || !stockedNameSet.has(key)) return []
      const mode = saleMode(sale)
      const soldQuantity = modeQuantity(sale, mode)
      if (soldQuantity <= 0) return []
      const saleDate = inventory.date ?? inventory.rangeFrom ?? inventory.createdAt
      const history = stockHistory.get(key) ?? []
      const stockRecord = [...history].reverse().find((entry) => entry.date <= saleDate)
      const costPrice = stockRecord?.costs[mode]
      if (costPrice == null || costPrice <= 0) return []
      const amount = Number(sale.total ?? 0)
      const unitSalePrice = Number(sale.price ?? (amount / soldQuantity))
      if (unitSalePrice >= costPrice) return []
      return [{
        id: sale.id,
        saleId: inventory.id,
        date: inventory.date,
        rangeFrom: inventory.rangeFrom,
        rangeTo: inventory.rangeTo,
        customerSn: sale.customerSn,
        productName: sale.productName,
        quantity: sale.totalPcs ?? sale.qty ?? sale.pcsQty ?? 0,
        amount,
        mode,
        modeQuantity: soldQuantity,
        salePrice: unitSalePrice,
        costPrice,
        loss: (costPrice - unitSalePrice) * soldQuantity,
      }]
    }))

    return NextResponse.json({ stockedProducts, rows, lossRows }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load unstocked sales" }, { status: 500 })
  }
}
