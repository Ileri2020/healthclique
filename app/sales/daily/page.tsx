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
  const [sales, setSales] = useState<DailySale[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const queryDate = new URLSearchParams(window.location.search).get("date")
    if (queryDate) setDate(queryDate)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/inventory/sales?date=${date}`)
      .then((response) => response.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [date])

  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0), [sales])
  const changeDate = (days: number) => {
    const nextDate = new Date(`${date}T00:00:00`)
    nextDate.setDate(nextDate.getDate() + days)
    const nextValue = format(nextDate, "yyyy-MM-dd")
    setDate(nextValue)
    router.replace(`/sales/daily?date=${nextValue}`)
  }
  const selectDate = (nextDate: string) => {
    setDate(nextDate)
    router.replace(`/sales/daily?date=${nextDate}`)
    setFilterOpen(false)
  }
  let serialNumber = 0

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Daily sales report</p>
          <h1 className="text-3xl font-bold">Sales for {format(new Date(`${date}T00:00:00`), "PPP")}</h1>
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
          <DialogHeader><DialogTitle>Filter daily sales</DialogTitle><DialogDescription>Select another date to view its sales.</DialogDescription></DialogHeader>
          <input type="date" className="rounded-md border bg-background px-3 py-2 text-sm text-foreground" value={date} onChange={(event) => setDate(event.target.value)} />
          <DialogFooter><Button onClick={() => selectDate(date)}>Show sales</Button></DialogFooter>
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

      {!loading ? <div className="flex justify-end"><div className="rounded-lg border bg-muted/30 px-4 py-3 text-right"><p className="text-sm text-muted-foreground">Total sales for the day</p><p className="text-xl font-semibold">₦{totalSales.toLocaleString()}</p></div></div> : null}
    </main>
  )
}
