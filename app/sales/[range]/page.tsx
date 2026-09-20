"use client"

import { use, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SaleHistory = {
  id: string
  date?: string | null
  rangeFrom?: string | null
  rangeTo?: string | null
  customerName?: string
  products: string[]
  total?: number
  paymentMethod?: string | null
  cashPaid?: number | null
  posPayment?: number | null
  change?: number | null
}

export default function SalesHistoryPage({ params }: { params: Promise<{ range: string }> }) {
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
        <Button variant="outline" asChild><Link href="/sales">Back to sales</Link></Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead className="w-[120px] max-w-[120px]">Date</TableHead><TableHead className="min-w-[180px]">Customer name</TableHead><TableHead className="min-w-[240px]">Products</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Cash</TableHead><TableHead>POS</TableHead><TableHead>Change</TableHead><TableHead>Delete</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9}>Loading sales...</TableCell></TableRow> : sales.length === 0 ? <TableRow><TableCell colSpan={9}>No sales found.</TableCell></TableRow> : sales.map((sale, index) => (
              <TableRow key={`${sale.id}-${index}`} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/sales/view/${sale.id}`}>
                <TableCell className="w-[120px] max-w-[120px] truncate">{sale.date ? format(new Date(sale.date), "MMM d, yyyy") : sale.rangeFrom && sale.rangeTo ? `${format(new Date(sale.rangeFrom), "MMM d, yyyy")} - ${format(new Date(sale.rangeTo), "MMM d, yyyy")}` : "-"}</TableCell>
                <TableCell>{sale.customerName || "-"}</TableCell>
                <TableCell>{sale.products.join(", ") || "-"}</TableCell>
                <TableCell>₦{Number(sale.total || 0).toLocaleString()}</TableCell>
                <TableCell>{sale.paymentMethod || "-"}</TableCell>
                <TableCell>₦{Number(sale.cashPaid || 0).toLocaleString()}</TableCell>
                <TableCell>₦{Number(sale.posPayment || 0).toLocaleString()}</TableCell>
                <TableCell>₦{Number(sale.change || 0).toLocaleString()}</TableCell>
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
      {!loading && sales.length > 0 && (
        <div className="flex justify-end">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-right">
            <p className="text-sm text-muted-foreground">Total sales for this range</p>
            <p className="text-xl font-semibold">₦{totalSales.toLocaleString()}</p>
          </div>
        </div>
      )}
    </main>
  )
}
