import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const normalizeProductName = (name: string) => name.replace(/\s+/g, " ").trim().toLowerCase()
const uniqueNames = (names: string[]) => [...new Set(names.filter(Boolean))]

export async function mergeInventoryProductNames(source: string, target: string) {
  const sourceKey = normalizeProductName(source)
  const targetKey = normalizeProductName(target)

  if (!sourceKey || !targetKey || sourceKey === targetKey) {
    throw new Error("Two different product names are required")
  }

  const [stocks, sales, countLines, shelfAssignments] = await Promise.all([
    prisma.inventoryStock.findMany({ select: { productName: true } }),
    prisma.inventorySale.findMany({ select: { productName: true } }),
    prisma.stockCountLine.findMany({ select: { productName: true } }),
    prisma.productShelf.findMany({ select: { id: true, productName: true, shelfId: true, shelfName: true } }),
  ])

  const matchingNames = (names: string[]) => uniqueNames(names.filter((name) => normalizeProductName(name) === sourceKey))
  const stockNames = matchingNames(stocks.map((row) => row.productName))
  const saleNames = matchingNames(sales.map((row) => row.productName))
  const countLineNames = matchingNames(countLines.map((row) => row.productName))
  const sourceAssignments = shelfAssignments.filter((row) => normalizeProductName(row.productName) === sourceKey)
  const targetAssignments = shelfAssignments.filter((row) => normalizeProductName(row.productName) === targetKey)

  const operations: Prisma.PrismaPromise<unknown>[] = []
  if (stockNames.length) operations.push(prisma.inventoryStock.updateMany({ where: { productName: { in: stockNames } }, data: { productName: target } }))
  if (saleNames.length) operations.push(prisma.inventorySale.updateMany({ where: { productName: { in: saleNames } }, data: { productName: target } }))
  if (countLineNames.length) operations.push(prisma.stockCountLine.updateMany({ where: { productName: { in: countLineNames } }, data: { productName: target } }))

  const shelfSurvivor = targetAssignments[0] ?? sourceAssignments[0]
  if (shelfSurvivor) {
    const shelfId = targetAssignments.find((row) => row.shelfId)?.shelfId ?? sourceAssignments.find((row) => row.shelfId)?.shelfId ?? null
    const shelfName = targetAssignments.find((row) => row.shelfName)?.shelfName ?? sourceAssignments.find((row) => row.shelfName)?.shelfName ?? null
    operations.push(prisma.productShelf.update({
      where: { id: shelfSurvivor.id },
      data: { productName: target, shelfId, shelfName },
    }))
    const duplicateIds = [...targetAssignments, ...sourceAssignments]
      .filter((row) => row.id !== shelfSurvivor.id)
      .map((row) => row.id)
    if (duplicateIds.length) operations.push(prisma.productShelf.deleteMany({ where: { id: { in: duplicateIds } } }))
  }

  const results = operations.length ? await prisma.$transaction(operations) : []
  let resultIndex = 0
  const updatedStocksCount = stockNames.length ? (results[resultIndex++] as { count: number }).count : 0
  const updatedSalesCount = saleNames.length ? (results[resultIndex++] as { count: number }).count : 0
  const updatedCountLinesCount = countLineNames.length ? (results[resultIndex++] as { count: number }).count : 0

  return { updatedStocksCount, updatedSalesCount, updatedCountLinesCount, updatedShelfCount: sourceAssignments.length }
}