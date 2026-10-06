"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Printer, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatReceiptMoney, openSalesReceiptPrintWindow, type SalesReceipt } from "@/lib/sales-receipts"

type SaleHistoryRow = {
  productName: string
  qty?: number | null
  amount?: number | null
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

type SaleHistory = {
  id: string
  date?: string | null
  rangeFrom?: string | null
  rangeTo?: string | null
  customerName?: string
  products: string[]
  rows?: SaleHistoryRow[]
  total?: number
  paymentMethod?: string | null
  cashPaid?: number | null
  posPayment?: number | null
  change?: number | null
}

export default function SalesHistoryPage({ params }: { params: Promise<{ range: string }> }) {
  const router = useRouter()
  const [sales, setSales] = useState<SaleHistory[]>([])
  const [loading, setLoading] = useState(true)
  const token = use(params).range
  const [from, to] = token === "all" ? ["", ""] : token.includes("_to_") ? token.split("_to_") : [token, token]

  useEffect(() => {
    fetch(`/api/inventory/sales?${from ? `from=${from}&to=${to}` : ""}`)
      .then((response) => response.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [from, to])

  const totalSales = useMemo(() =>
    sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [sales],
  )

  const selectedRangeDays = from && to
    ? differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
    : 0
  const hasSaleLongerThanThreeDays = sales.some((sale) =>
    sale.rangeFrom && sale.rangeTo && differenceInCalendarDays(new Date(sale.rangeTo), new Date(sale.rangeFrom)) + 1 > 3
  )
  const printAllDisabled = loading || sales.length === 0 || selectedRangeDays < 1 || selectedRangeDays > 3 || hasSaleLongerThanThreeDays

  const createReceipt = (sale: SaleHistory): SalesReceipt => ({
    receiptNumber: `HC-${sale.id.slice(-8).toUpperCase()}`,
    customerName: sale.customerName || "",
    date: sale.date
      ? format(new Date(sale.date), "MMM d, yyyy")
      : sale.rangeFrom && sale.rangeTo
      ? `${format(new Date(sale.rangeFrom), "MMM d, yyyy")} - ${format(new Date(sale.rangeTo), "MMM d, yyyy")}`
      : "Saved sale",
    paymentMethod: sale.paymentMethod === "cash&pos" ? "Cash & transfer" : sale.paymentMethod || "",
    cashPaid: Number(sale.cashPaid) || 0,
    posPayment: Number(sale.posPayment) || 0,
    change: Number(sale.change) || 0,
    total: Number(sale.total) || 0,
    rows: (sale.rows ?? []).map((row) => {
      const quantities = [
        Number(row.cartonQty) > 0 ? `${row.cartonQty} carton${Number(row.cartonQty) === 1 ? "" : "s"}` : "",
        Number(row.packQty) > 0 ? `${row.packQty} pack${Number(row.packQty) === 1 ? "" : "s"}` : "",
        Number(row.pcsQty) > 0 ? `${row.pcsQty} piece${Number(row.pcsQty) === 1 ? "" : "s"}` : "",
      ].filter(Boolean)
      const quantity = quantities.join(" + ") || `${Number(row.totalPcs ?? row.qty) || 0} pieces`
      const lineTotal = Number(row.amount) || 0
      const count = Number(row.qty ?? row.totalPcs) || 0
      return {
        productName: row.productName,
        quantity,
        unitPrice: Number(row.price) || (count ? lineTotal / count : 0),
        total: lineTotal,
      }
    }),
  })

  const printSale = (sale: SaleHistory) => {
    if (!openSalesReceiptPrintWindow([createReceipt(sale)])) {
      window.alert("Allow pop-ups for this site to print the receipt.")
    }
  }

  const printAllSales = () => {
    if (printAllDisabled) return
    if (!openSalesReceiptPrintWindow(sales.map(createReceipt))) {
      window.alert("Allow pop-ups for this site to print the receipts.")
    }
  }

  const deleteSale = async (id: string) => {
    if (!window.confirm("Delete this saved sale?")) return
    const response = await fetch(`/api/inventory/sales/${id}`, { method: "DELETE" })
    if (!response.ok) {
      window.alert("Unable to delete this sale.")
      return
    }
    setSales((current) => current.filter((sale) => sale.id !== id))
  }

  const heading = token === "all"
    ? "All sales"
    : from === to
    ? format(new Date(`${from}T00:00:00`), "PPP")
    : `${format(new Date(`${from}T00:00:00`), "PPP")} - ${format(new Date(`${to}T00:00:00`), "PPP")}`

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Saved sales entries</p><h1 className="text-3xl font-bold">{heading}</h1></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" asChild><Link href={`/sales/unstocked${from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`}>Products sold without stock</Link></Button>
          <Button variant="destructive" asChild><Link href={`/sales/unstocked?tab=loss${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`}>Sold on loss</Link></Button>
          <Button variant="outline" asChild><Link href="/sales">Back to sales</Link></Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead className="w-[120px] max-w-[120px]">Date</TableHead><TableHead className="min-w-[180px]">Customer name</TableHead><TableHead className="min-w-[240px]">Products</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Cash</TableHead><TableHead>POS</TableHead><TableHead>Change</TableHead><TableHead>Receipt</TableHead><TableHead>Delete</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={10}>Loading sales...</TableCell></TableRow> : sales.length === 0 ? <TableRow><TableCell colSpan={10}>No sales found.</TableCell></TableRow> : sales.map((sale, index) => (
              <TableRow key={`${sale.id}-${index}`} role="link" tabIndex={0} className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => router.push(`/sales?edit=${encodeURIComponent(sale.id)}`)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); router.push(`/sales?edit=${encodeURIComponent(sale.id)}`) } }}>
                <TableCell className="w-[120px] max-w-[120px] truncate">{sale.date ? format(new Date(sale.date), "MMM d, yyyy") : sale.rangeFrom && sale.rangeTo ? `${format(new Date(sale.rangeFrom), "MMM d, yyyy")} - ${format(new Date(sale.rangeTo), "MMM d, yyyy")}` : "-"}</TableCell>
                <TableCell>{sale.customerName || "-"}</TableCell>
                <TableCell>{sale.products.join(", ") || "-"}</TableCell>
                <TableCell>₦{Number(sale.total || 0).toLocaleString()}</TableCell>
                <TableCell>{sale.paymentMethod || "-"}</TableCell>
                <TableCell>₦{Number(sale.cashPaid || 0).toLocaleString()}</TableCell>
                <TableCell>₦{Number(sale.posPayment || 0).toLocaleString()}</TableCell>
                <TableCell>₦{Number(sale.change || 0).toLocaleString()}</TableCell>
                <TableCell><Button type="button" size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); printSale(sale) }}><Printer className="mr-2 h-4 w-4" />Print</Button></TableCell>
                <TableCell>
                  <button type="button" title="Delete sale" className="rounded p-2 text-destructive hover:bg-destructive/10" onClick={(event) => { event.stopPropagation(); deleteSale(sale.id) }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          {!from || !to
            ? "Choose a date range of up to 3 days to enable Print all."
            : selectedRangeDays > 3
            ? "Print all is limited to a maximum of 3 days. Choose a shorter range."
            : hasSaleLongerThanThreeDays
            ? "A saved sale spans more than 3 days and cannot be split safely for bulk printing."
            : "Print all receipts for the selected date range (maximum 3 days)."}
        </p>
        <Button type="button" onClick={printAllSales} disabled={printAllDisabled}><Printer className="mr-2 h-4 w-4" />Print all receipts</Button>
      </div>
      {!loading && sales.length > 0 && (
        <div className="flex justify-end">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-right">
            <p className="text-sm text-muted-foreground">Total sales for this range</p>
            <p className="text-xl font-semibold">{formatReceiptMoney(totalSales)}</p>
          </div>
        </div>
      )}
    </main>
  )
}
