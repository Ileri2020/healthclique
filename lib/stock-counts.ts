import { prisma } from "@/lib/prisma"

type StockRow = {
  productName: string
  totalPcs: number | null
  expiry: Date | null
  packsPerCarton: number | null
  pcsCount: number | null
  cartonQty: number | null
  packQty: number | null
  pcsQty: number | null
  cartonSalesPrice: number | null
  packSalesPrice: number | null
  pcsSalesPrice: number | null
  inventory: { date: Date | null; rangeFrom: Date | null; createdAt: Date }
}

type SaleRow = {
  productName: string
  totalPcs: number | null
  cartonQty: number | null
  packQty: number | null
  pcsQty: number | null
  packsPerCarton: number | null
  pcsCount: number | null
  inventory: { date: Date | null; rangeFrom: Date | null; createdAt: Date }
}

const keyFor = (name: string) => name.replace(/\s+/g, " ").trim().toLowerCase()
const eventDate = (row: { inventory: { date: Date | null; rangeFrom: Date | null; createdAt: Date } }) => row.inventory.date ?? row.inventory.rangeFrom ?? row.inventory.createdAt

const piecesFor = (row: { totalPcs: number | null; cartonQty: number | null; packQty: number | null; pcsQty: number | null; packsPerCarton: number | null; pcsCount: number | null }) => {
  if (row.totalPcs != null && row.totalPcs > 0) return row.totalPcs
  const packsPerCarton = row.packsPerCarton || 1
  const pcsCount = row.pcsCount || 1
  return (row.cartonQty || 0) * packsPerCarton * pcsCount + (row.packQty || 0) * pcsCount + (row.pcsQty || 0)
}

export async function getCountProducts() {
  const [stocks, sales, normalizedLines] = await Promise.all([
    prisma.inventoryStock.findMany({
      include: { inventory: { select: { date: true, rangeFrom: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.inventorySale.findMany({
      include: { inventory: { select: { date: true, rangeFrom: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.stockCountLine.findMany({
      where: { normalizedPcs: { not: null } },
      orderBy: { normalizedAt: "desc" },
      include: { count: { select: { date: true } } },
    }),
  ])

  const stockGroups = new Map<string, StockRow[]>()
  const saleGroups = new Map<string, SaleRow[]>()
  stocks.forEach((row) => {
    const key = keyFor(row.productName)
    if (!stockGroups.has(key)) stockGroups.set(key, [])
    stockGroups.get(key)!.push(row)
  })
  sales.forEach((row) => {
    const key = keyFor(row.productName)
    if (!saleGroups.has(key)) saleGroups.set(key, [])
    saleGroups.get(key)!.push(row)
  })

  const latestNormalized = new Map<string, { normalizedPcs: number; expiry: Date | null; date: Date }>()
  normalizedLines.forEach((line) => {
    const key = keyFor(line.productName)
    if (!latestNormalized.has(key)) latestNormalized.set(key, { normalizedPcs: line.normalizedPcs ?? 0, expiry: line.expiry, date: line.count.date })
  })

  return [...stockGroups.entries()].map(([key, productStocks]) => {
    const productSales = saleGroups.get(key) ?? []
    const lots = productStocks.map((stock) => ({ stock, remaining: piecesFor(stock) }))
    const sortedSales = [...productSales].sort((left, right) => eventDate(left).getTime() - eventDate(right).getTime())
    sortedSales.forEach((sale) => {
      let remainingSale = piecesFor(sale)
      for (const lot of lots) {
        if (remainingSale <= 0) break
        const used = Math.min(lot.remaining, remainingSale)
        lot.remaining -= used
        remainingSale -= used
      }
    })

    const latestStock = [...productStocks].sort((left, right) => eventDate(right).getTime() - eventDate(left).getTime())[0]
    const remainingLots = lots.filter((lot) => lot.remaining > 0)
    const expiry = remainingLots
      .map((lot) => lot.stock.expiry)
      .filter((value): value is Date => value !== null)
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null

    const normalized = latestNormalized.get(key)
    const expectedPcs = normalized
      ? normalized.normalizedPcs
        + productStocks.filter((stock) => eventDate(stock) > normalized.date).reduce((sum, stock) => sum + piecesFor(stock), 0)
        - productSales.filter((sale) => eventDate(sale) > normalized.date).reduce((sum, sale) => sum + piecesFor(sale), 0)
      : remainingLots.reduce((sum, lot) => sum + lot.remaining, 0)
    return {
      productName: latestStock?.productName ?? productStocks[0].productName,
      productKey: key,
      expectedPcs: Math.max(expectedPcs, 0),
      expiry: normalized?.expiry ?? expiry,
      packsPerCarton: latestStock?.packsPerCarton ?? 0,
      pcsCount: latestStock?.pcsCount ?? 0,
      salesPrice: latestStock?.pcsSalesPrice ?? latestStock?.packSalesPrice ?? latestStock?.cartonSalesPrice ?? null,
    }
  }).sort((left, right) => left.productName.localeCompare(right.productName))
}
