export type LocalCountLine = {
  productName: string
  shelfName?: string
  shelfId?: string
  expectedPcs: number
  countedPcs: number | null
  expiry?: string
  packsPerCarton?: number
  piecesPerPack?: number
}

export type LocalCountPayload = {
  date: string
  shelfName?: string
  shelfId?: string
  lines: LocalCountLine[]
}

export type LocalStockCount = {
  localId: string
  savedAt: string
  syncedAt?: string
  staffName: string
  payload: LocalCountPayload
}

export type LocalCountCatalog = {
  date: string
  shelfFilter: string
  products: Array<Record<string, unknown>>
  shelves: Array<Record<string, unknown>>
  updatedAt: string
}

const COUNTS_STORAGE_KEY = "healthclique.local-stock-counts.v1"
const COUNT_CATALOG_STORAGE_KEY = "healthclique.local-count-catalog.v1"
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const LOCAL_DATA_CHANGED_EVENT = "healthclique:local-data-changed"

const notifyLocalDataChanged = () => window.dispatchEvent(new Event(LOCAL_DATA_CHANGED_EVENT))

export const readLocalCounts = (): LocalStockCount[] => {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(window.localStorage.getItem(COUNTS_STORAGE_KEY) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const saveLocalCount = (count: LocalStockCount) => {
  window.localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify([...readLocalCounts(), count]))
  notifyLocalDataChanged()
}

export const updateLocalCount = (localId: string, update: Partial<LocalStockCount>) => {
  const counts = readLocalCounts().map((count) => count.localId === localId ? { ...count, ...update } : count)
  window.localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(counts))
  notifyLocalDataChanged()
}

export const pruneSyncedLocalCounts = () => {
  if (typeof window === "undefined") return
  const cutoff = Date.now() - THREE_DAYS_MS
  const counts = readLocalCounts()
  const retained = counts.filter((count) => !count.syncedAt || new Date(count.syncedAt).getTime() > cutoff)
  if (retained.length !== counts.length) {
    window.localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(retained))
    notifyLocalDataChanged()
  }
}

export const readLocalCountCatalog = (date: string, shelfFilter: string): LocalCountCatalog | null => {
  if (typeof window === "undefined") return null
  try {
    const catalog = JSON.parse(window.localStorage.getItem(COUNT_CATALOG_STORAGE_KEY) ?? "[]")
    if (!Array.isArray(catalog)) return null
    return catalog.find((entry) => entry?.date === date && entry?.shelfFilter === shelfFilter) ?? null
  } catch {
    return null
  }
}

export const saveLocalCountCatalog = (catalog: Omit<LocalCountCatalog, "updatedAt">) => {
  const existing = (() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(COUNT_CATALOG_STORAGE_KEY) ?? "[]")
      return Array.isArray(value) ? value as LocalCountCatalog[] : []
    } catch {
      return []
    }
  })()
  const next = existing.filter((entry) => entry.date !== catalog.date || entry.shelfFilter !== catalog.shelfFilter)
  next.push({ ...catalog, updatedAt: new Date().toISOString() })
  window.localStorage.setItem(COUNT_CATALOG_STORAGE_KEY, JSON.stringify(next.slice(-20)))
}