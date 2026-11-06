export type LocalStockPayload = {
  date: { date?: string | Date; from?: string | Date; to?: string | Date }
  companyName?: string
  repName?: string
  amountPaid?: number
  rows: Array<Record<string, unknown>>
}

export type LocalStock = {
  localId: string
  savedAt: string
  syncedAt?: string
  payload: LocalStockPayload
}

const STOCKS_STORAGE_KEY = "healthclique.local-stock-intakes.v1"
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

const notifyLocalDataChanged = () => window.dispatchEvent(new Event("healthclique:local-data-changed"))

export const readLocalStocks = (): LocalStock[] => {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(window.localStorage.getItem(STOCKS_STORAGE_KEY) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const saveLocalStock = (stock: LocalStock) => {
  window.localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify([...readLocalStocks(), stock]))
  notifyLocalDataChanged()
}

export const updateLocalStock = (localId: string, update: Partial<LocalStock>) => {
  const stocks = readLocalStocks().map((stock) => stock.localId === localId ? { ...stock, ...update } : stock)
  window.localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks))
  notifyLocalDataChanged()
}

export const pruneSyncedLocalStocks = () => {
  if (typeof window === "undefined") return
  const cutoff = Date.now() - THREE_DAYS_MS
  const stocks = readLocalStocks()
  const retained = stocks.filter((stock) => !stock.syncedAt || new Date(stock.syncedAt).getTime() > cutoff)
  if (retained.length !== stocks.length) {
    window.localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(retained))
    notifyLocalDataChanged()
  }
}
