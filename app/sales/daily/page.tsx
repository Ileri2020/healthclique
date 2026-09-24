"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DailySaleRow = {
  sn?: number | null
  customerName?: string | null
  productName: string
  qty?: number | null
  amount?: number | null
}

type DailySale = {
  id: string
  customerName?: string | null
  total?: number | null
  rows?: DailySaleRow[]
}

export default function DailySalesPage() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [filterMode, setFilterMode] = useState<"single" | "range">("single")
  const [sales, setSales] = useState<DailySale[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryFrom = params.get("from")
    const queryTo = params.get("to")
    const queryDate = params.get("date")
    if (queryFrom && queryTo) {
      setFromDate(queryFrom)
      setToDate(queryTo)
      setFilterMode("range")
    } else if (queryDate) {
      setDate(queryDate)
      setFromDate(queryDate)
      setToDate(queryDate)
      setFilterMode("single")
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const query = filterMode === "range" && fromDate && toDate
      ? `from=${fromDate}&to=${toDate}`
      : `date=${date}`
    fetch(`/api/inventory/sales?${query}`)
      .then((response) => response.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [date, filterMode, fromDate, toDate])

  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0), [sales])
  const changeDate = (days: number) => {
    const start = new Date(`${filterMode === "range" ? fromDate : date}T00:00:00`)
    const end = new Date(`${filterMode === "range" ? toDate : date}T00:00:00`)
    start.setDate(start.getDate() + days)
    end.setDate(end.getDate() + days)
    const nextFrom = format(start, "yyyy-MM-dd")
    const nextTo = format(end, "yyyy-MM-dd")
    setDate(nextFrom)
    setFromDate(nextFrom)
    setToDate(nextTo)
    router.replace(filterMode === "range" ? `/sales/daily?from=${nextFrom}&to=${nextTo}` : `/sales/daily?date=${nextFrom}`)
  }
  const selectFilter = () => {
    if (filterMode === "range") {
      if (!fromDate || !toDate || fromDate > toDate) return
      setDate(fromDate)
      router.replace(`/sales/daily?from=${fromDate}&to=${toDate}`)
    } else {
      setFromDate(date)
      setToDate(date)
      router.replace(`/sales/daily?date=${date}`)
    }
    setFilterOpen(false)
  }
  const heading = filterMode === "range" && fromDate && toDate
    ? `${format(new Date(`${fromDate}T00:00:00`), "PPP")} - ${format(new Date(`${toDate}T00:00:00`), "PPP")}`
    : format(new Date(`${date}T00:00:00`), "PPP")
  let serialNumber = 0

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Daily sales report</p>
          <h1 className="text-3xl font-bold">Sales for {heading}</h1>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={() => changeDate(-1)}>Previous day</Button>
          <Button variant="outline" onClick={() => changeDate(1)}>Next day</Button>
          <Button variant="outline" onClick={() => setFilterOpen(true)}>Filter date</Button>
          <Button variant="outline" asChild><Link href="/sales">Back to sales</Link></Button>
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Filter daily sales</DialogTitle><DialogDescription>Choose one date or a date range to view sales.</DialogDescription></DialogHeader>
          <div className="flex gap-2"><Button type="button" variant={filterMode === "single" ? "default" : "outline"} onClick={() => setFilterMode("single")}>Single date</Button><Button type="button" variant={filterMode === "range" ? "default" : "outline"} onClick={() => setFilterMode("range")}>Date range</Button></div>
          {filterMode === "range" ? <div className="grid gap-3"><label className="text-sm font-medium">Starting date<input type="date" className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="text-sm font-medium">End date<input type="date" className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></div> : <label className="text-sm font-medium">Sales date<input type="date" className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
          <DialogFooter><Button onClick={selectFilter} disabled={filterMode === "range" && (!fromDate || !toDate || fromDate > toDate)}>Show sales</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead className="w-16">S/N</TableHead><TableHead>Product name</TableHead><TableHead>Quantity</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Loading daily sales...</TableCell></TableRow> : sales.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center">No sales recorded for this date.</TableCell></TableRow> : sales.flatMap((sale) => {
              const rows = sale.rows ?? []
              const customerName = sale.customerName || rows.find((row) => row.customerName)?.customerName || ""
              const customerRow = customerName ? [<TableRow key={`${sale.id}-customer`} className="bg-muted/30"><TableCell colSpan={4} className="font-semibold">{customerName} ({rows.length} {rows.length === 1 ? "product" : "products"})</TableCell></TableRow>] : []
              const productRows = rows.map((row, rowIndex) => {
                serialNumber += 1
                return <TableRow key={`${sale.id}-${rowIndex}`}><TableCell>{serialNumber}</TableCell><TableCell>{row.productName || "-"}</TableCell><TableCell>{Number(row.qty || 0).toLocaleString()}</TableCell><TableCell>₦{Number(row.amount || 0).toLocaleString()}</TableCell></TableRow>
              })
              return [...customerRow, ...productRows]
            })}
          </TableBody>
        </Table>
      </div>

      {!loading ? <div className="flex justify-end"><div className="rounded-lg border bg-muted/30 px-4 py-3 text-right"><p className="text-sm text-muted-foreground">{filterMode === "range" ? "Total sales for the range" : "Total sales for the day"}</p><p className="text-xl font-semibold">₦{totalSales.toLocaleString()}</p></div></div> : null}
    </main>
  )
}
