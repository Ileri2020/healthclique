import { prisma } from "@/lib/prisma"

const productKey = (name: string) => name.replace(/\s+/g, " ").trim().toLowerCase()

export async function getStockCountOrders(dateText: string) {
  const dayStart = new Date(`${dateText}T00:00:00.000Z`)
  const dayEnd = new Date(`${dateText}T23:59:59.999Z`)
  const lines = await prisma.stockCountLine.findMany({
    where: { count: { date: { gte: dayStart, lte: dayEnd } }, countOrder: { not: null } },
    select: { productName: true, countOrder: true },
    orderBy: { countOrder: "asc" },
  })

  const orderByProduct = new Map<string, number>()
  for (const line of lines) {
    const key = productKey(line.productName)
    if (key && line.countOrder != null && !orderByProduct.has(key)) orderByProduct.set(key, line.countOrder)
  }
  return orderByProduct
}

export async function assignStockCountOrders<T extends Record<string, any>>(dateText: string, lines: T[]): Promise<Array<T & { countOrder: number | null }>> {
  const existingOrders = await getStockCountOrders(dateText)
  let nextOrder = Math.max(0, ...existingOrders.values())
  const result = new Map<string, number | null>()
  const countedLines = lines
    .filter((line) => line.countedPcs !== "" && line.countedPcs != null)
    .slice()
    .sort((left, right) => Number(left.countOrder || Number.MAX_SAFE_INTEGER) - Number(right.countOrder || Number.MAX_SAFE_INTEGER))

  for (const line of countedLines) {
    const name = String(line.productName || "")
    const key = productKey(name)
    if (!key) continue
    const existingOrder = existingOrders.get(key)
    if (existingOrder != null) {
      result.set(key, existingOrder)
      continue
    }
    if (!result.has(key)) result.set(key, ++nextOrder)
  }

  return lines.map((line): T & { countOrder: number | null } => {
    const key = productKey(String(line.productName || ""))
    return { ...line, countOrder: result.get(key) ?? existingOrders.get(key) ?? null }
  })
}
