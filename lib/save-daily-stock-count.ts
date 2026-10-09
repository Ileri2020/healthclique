import { prisma } from "@/lib/prisma"
import { assignStockCountOrders } from "@/lib/stock-count-order"

const productKey = (name: string) => name.replace(/\s+/g, " ").trim().toLowerCase()

type SaveDailyStockCountInput = {
  date: string
  lines: Array<Record<string, any>>
  shelfId?: string
  shelfName?: string
  note?: string
  localSyncId?: string
  staffName?: string
  createdById?: string
}

const lineData = (line: Record<string, any>, existing?: Record<string, any>) => {
  const countedPcs = line.countedPcs === "" || line.countedPcs == null
    ? (existing?.countedPcs ?? null)
    : Number(line.countedPcs)
  const expectedPcs = Number.isFinite(Number(line.expectedPcs)) ? Number(line.expectedPcs) : (existing?.expectedPcs ?? 0)
  const expiry = line.expiry ? new Date(line.expiry) : (existing?.expiry ?? null)
  return {
    productName: String(line.productName || existing?.productName || "").trim(),
    countOrder: line.countOrder ?? existing?.countOrder ?? undefined,
    shelfName: line.shelfName || existing?.shelfName || undefined,
    expectedPcs,
    countedPcs,
    differencePcs: countedPcs == null ? null : countedPcs - expectedPcs,
    expiry,
    packsPerCarton: line.packsPerCarton ? Number(line.packsPerCarton) : (existing?.packsPerCarton ?? null),
    piecesPerPack: line.piecesPerPack ? Number(line.piecesPerPack) : (existing?.piecesPerPack ?? null),
  }
}

export async function saveDailyStockCount(input: SaveDailyStockCountInput) {
  const dateText = input.date.slice(0, 10)
  const date = new Date(`${dateText}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || Number.isNaN(date.getTime())) throw new Error("Invalid count date")
  if (!input.lines.length) throw new Error("No count lines provided")

  const dayStart = new Date(`${dateText}T00:00:00.000Z`)
  const dayEnd = new Date(`${dateText}T23:59:59.999Z`)
  const sessions = await prisma.stockCount.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    orderBy: { createdAt: "asc" },
    include: { lines: true },
  })
  const session = sessions[0]
  const existingByProduct = new Map<string, (typeof sessions)[number]["lines"][number]>()
  sessions.forEach((dailySession) => dailySession.lines.forEach((line) => {
    const key = productKey(line.productName)
    if (key) existingByProduct.set(key, line)
  }))
  const orderedInput = await assignStockCountOrders(dateText, input.lines)
  const deduplicated = new Map<string, Record<string, any>>()
  orderedInput.forEach((line) => {
    const key = productKey(String(line.productName || ""))
    if (key) deduplicated.set(key, line)
  })

  const lineUpdates: Array<{ id: string; data: ReturnType<typeof lineData> }> = []
  const lineCreates: Array<ReturnType<typeof lineData>> = []
  for (const [key, line] of deduplicated) {
    const existing = existingByProduct.get(key)
    const data = lineData(line, existing ?? undefined)
    if (existing) lineUpdates.push({ id: existing.id, data })
    else lineCreates.push(data)
  }

  if (!session) {
    const created = await prisma.stockCount.create({
      data: {
        date,
        ...(input.shelfId ? { shelfId: input.shelfId } : {}),
        ...(input.shelfName ? { shelfName: input.shelfName } : {}),
        ...(input.note ? { note: input.note.trim() } : {}),
        ...(input.localSyncId ? { localSyncId: input.localSyncId } : {}),
        ...(input.staffName ? { staffName: input.staffName.trim() } : {}),
        ...(input.createdById ? { createdById: input.createdById } : {}),
        lines: { create: [...lineUpdates.map((line) => line.data), ...lineCreates] },
      },
      include: { lines: true, shelf: true },
    })
    return { count: created, updated: false }
  }

  const updated = await prisma.stockCount.update({
    where: { id: session.id },
    data: {
      ...(input.shelfId ? { shelfId: input.shelfId } : {}),
      ...(input.shelfName ? { shelfName: input.shelfName } : {}),
      ...(input.note ? { note: input.note.trim() } : {}),
      ...(input.localSyncId ? { localSyncId: input.localSyncId } : {}),
      ...(input.staffName ? { staffName: input.staffName.trim() } : {}),
      ...(input.createdById ? { createdById: input.createdById } : {}),
    },
    include: { lines: true, shelf: true },
  })

  await Promise.all(lineUpdates.map(({ id, data }) => prisma.stockCountLine.update({ where: { id }, data })))
  if (lineCreates.length) {
    await prisma.stockCountLine.createMany({ data: lineCreates.map((line) => ({ ...line, countId: session.id })) })
  }
  const count = await prisma.stockCount.findUnique({ where: { id: session.id }, include: { lines: true, shelf: true } })
  if (!count) throw new Error("Unable to reload saved daily count")
  return { count, updated: true }
}
