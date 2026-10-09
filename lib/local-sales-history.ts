import { format } from "date-fns"
import { readLocalSales, type LocalSale } from "@/lib/local-sales"

type LocalHistoryRow = {
  sn?: number | null
  customerName?: string
  productName: string
  qty: number
  amount: number
  carton?: boolean
  cartonQty?: number | null
  packsPerCarton?: number | null
  pack?: boolean
  packQty?: number | null
  pcsCount?: number | null
  pcsQty?: number | null
  totalPcs?: number | null
  price?: number | null
}

export type LocalSalesHistoryItem = {
  id: string
  localSaleId: string
  isLocal: true
  date?: string | null
  rangeFrom?: string | null
  rangeTo?: string | null
  customerName: string
  products: string[]
  rows: LocalHistoryRow[]
  total: number
  paymentMethod?: string
  cashPaid: number
  posPayment: number
  change: number
  staffName: string
}

const toDateText = (value: unknown) => {
  if (!value) return ""
  const date = new Date(value as string | Date)
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd")
}

const numberOrZero = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const toHistoryItem = (sale: LocalSale, section: LocalSale["payload"]["sections"][number], sectionIndex: number): LocalSalesHistoryItem => {
  const date = toDateText(sale.payload.date.date)
  const rangeFrom = toDateText(sale.payload.date.from)
  const rangeTo = toDateText(sale.payload.date.to)
  const rows = section.rows.map((row, index): LocalHistoryRow => ({
    sn: numberOrZero(row.sn) || index + 1,
    customerName: String(row.customerName || section.customerName || ""),
    productName: String(row.productName || ""),
    qty: numberOrZero(row.totalPcs || row.qty),
    amount: numberOrZero(row.total),
    carton: Boolean(row.carton),
    cartonQty: numberOrZero(row.cartonQty),
    packsPerCarton: numberOrZero(row.packsPerCarton),
    pack: Boolean(row.pack),
    packQty: numberOrZero(row.packQty),
    pcsCount: numberOrZero(row.pcsCount),
    pcsQty: numberOrZero(row.pcsQty),
    totalPcs: numberOrZero(row.totalPcs),
    price: numberOrZero(row.salesPrice),
  }))

  return {
    id: `local-${sale.localId}-${sectionIndex}`,
    localSaleId: sale.localId,
    isLocal: true,
    date: date || null,
    rangeFrom: rangeFrom || null,
    rangeTo: rangeTo || null,
    customerName: section.customerName || rows[0]?.customerName || "",
    products: rows.map((row) => row.productName).filter(Boolean),
    rows,
    total: rows.reduce((sum, row) => sum + row.amount, 0),
    paymentMethod: section.paymentMethod,
    cashPaid: numberOrZero(section.cashPaid),
    posPayment: numberOrZero(section.posPayment),
    change: numberOrZero(section.change),
    staffName: sale.staffName,
  }
}

export const readLocalSalesHistory = (from?: string, to?: string) => {
  const start = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY

  return readLocalSales()
    .filter((sale) => !sale.syncedAt)
    .flatMap((sale) => sale.payload.sections.map((section, index) => toHistoryItem(sale, section, index)))
    .filter((sale) => {
      const saleStart = new Date(`${sale.date || sale.rangeFrom || sale.rangeTo}T00:00:00`).getTime()
      const saleEnd = new Date(`${sale.rangeTo || sale.date || sale.rangeFrom}T23:59:59.999`).getTime()
      return !Number.isNaN(saleStart) && !Number.isNaN(saleEnd) && saleStart <= end && saleEnd >= start
    })
    .sort((left, right) => {
      const leftDate = left.date || left.rangeFrom || ""
      const rightDate = right.date || right.rangeFrom || ""
      return rightDate.localeCompare(leftDate)
    })
}
