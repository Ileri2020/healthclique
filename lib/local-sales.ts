export type LocalSalePayload = {
  date: { date?: string | Date; from?: string | Date; to?: string | Date }
  sections: Array<{
    customerName?: string
    paymentMethod?: string
    cashPaid?: number
    posPayment?: number
    change?: number
    rows: Array<Record<string, unknown>>
  }>
}

export type LocalSale = {
  localId: string
  savedAt: string
  syncedAt?: string
  staffName: string
  payload: LocalSalePayload
}

export type LocalProductCatalog = {
  productNames: string[]
  stockRows: Array<{
    productName: string
    carton?: boolean
    cartonQty?: number | null
    packsPerCarton?: number | null
    pack?: boolean
    packQty?: number | null
    pcsCount?: number | null
    pcsQty?: number | null
    totalPcs?: number | null
    pcsSalesPrice?: number | null
    packSalesPrice?: number | null
    cartonSalesPrice?: number | null
    expiry?: string | null
  }>
  stockPricing: Record<string, {
    costPrice?: number
    cartonSalesPrice?: number
    packSalesPrice?: number
    pcsSalesPrice?: number
    wholesaleCartonSalesPrice?: number
    wholesalePackSalesPrice?: number
    wholesalePcsSalesPrice?: number
    packsPerCarton?: number
    pcsCount?: number
    pcsCostPrice?: number
    cheapestRecentPcsCostPrice?: number
    recentPcsCostPrices?: number[]
  }>
  updatedAt: string
}

const SALES_STORAGE_KEY = "healthclique.local-sales.v1"
const CATALOG_STORAGE_KEY = "healthclique.local-product-catalog.v1"
const STAFF_STORAGE_KEY = "healthclique.local-staff-name.v1"
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export const isLocalDevelopment = () => {
  if (typeof window === "undefined") return false
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
}

const notifyLocalSalesChanged = () => {
  window.dispatchEvent(new Event("healthclique:local-sales-changed"))
  window.dispatchEvent(new Event("healthclique:local-data-changed"))
}

export const readLocalSales = (): LocalSale[] => {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(window.localStorage.getItem(SALES_STORAGE_KEY) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const saveLocalSale = (sale: LocalSale) => {
  const sales = readLocalSales()
  window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([...sales, sale]))
  notifyLocalSalesChanged()
}

export const updateLocalSale = (localId: string, update: Partial<LocalSale>) => {
  const sales = readLocalSales().map((sale) => sale.localId === localId ? { ...sale, ...update } : sale)
  window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales))
  notifyLocalSalesChanged()
}

export const pruneSyncedLocalSales = () => {
  if (typeof window === "undefined") return
  const cutoff = Date.now() - THREE_DAYS_MS
  const sales = readLocalSales()
  const retained = sales.filter((sale) => !sale.syncedAt || new Date(sale.syncedAt).getTime() > cutoff)
  if (retained.length !== sales.length) {
    window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(retained))
    notifyLocalSalesChanged()
  }
}

export const readLocalProductCatalog = (): LocalProductCatalog | null => {
  if (typeof window === "undefined") return null
  try {
    const catalog = JSON.parse(window.localStorage.getItem(CATALOG_STORAGE_KEY) ?? "null")
    return catalog && Array.isArray(catalog.productNames) && catalog.stockPricing
      ? { ...catalog, stockRows: Array.isArray(catalog.stockRows) ? catalog.stockRows : [] }
      : null
  } catch {
    return null
  }
}

export const saveLocalProductCatalog = (update: Partial<Pick<LocalProductCatalog, "productNames" | "stockPricing" | "stockRows">>) => {
  const current = readLocalProductCatalog()
  const next: LocalProductCatalog = {
    productNames: update.productNames ?? current?.productNames ?? [],
    stockRows: update.stockRows ?? current?.stockRows ?? [],
    stockPricing: update.stockPricing ?? current?.stockPricing ?? {},
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(next))
}

export const readLocalStaffName = () => {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(STAFF_STORAGE_KEY) ?? ""
}

export const saveLocalStaffName = (name: string) => {
  window.localStorage.setItem(STAFF_STORAGE_KEY, name.trim())
}