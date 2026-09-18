"use client"

import { use, useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Stock = Record<string, string | number | boolean | null | undefined> & { date?: string; rangeFrom?: string; rangeTo?: string }

export default function StockHistoryPage({ params }: { params: Promise<{ range: string }> }) {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const token = use(params).range
  const [from, to] = token === "all" ? ["", ""] : token.includes("_to_") ? token.split("_to_") : [token, token]

  useEffect(() => {
    fetch(`/api/inventory/stock?history=true${from ? `&from=${from}&to=${to}` : ""}`)
      .then((response) => response.json())
      .then((data) => setStocks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [from, to])

  const deletePurchase = async (id: string) => {
    if (!window.confirm("Delete this saved stock purchase?")) return
    const response = await fetch(`/api/inventory/stock/${id}`, { method: "DELETE" })
    if (!response.ok) {
      window.alert("Unable to delete this stock purchase.")
      return
    }
    setStocks((current) => current.filter((stock) => String(stock.id) !== id))
  }

  const heading = token === "all"
    ? "All stock purchases"
    : from === to
    ? format(new Date(`${from}T00:00:00`), "PPP")
    : `${format(new Date(`${from}T00:00:00`), "PPP")} - ${format(new Date(`${to}T00:00:00`), "PPP")}`

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Saved stock purchases</p><h1 className="text-3xl font-bold">{heading}</h1></div>
        <Button variant="outline" onClick={() => window.location.href = "/stock"}>Back to stock</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="min-w-[200px]">Company name</TableHead><TableHead className="min-w-[200px]">Rep name</TableHead><TableHead>Total</TableHead><TableHead>Amount paid</TableHead><TableHead>Balance</TableHead><TableHead>Delete</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7}>Loading stocks...</TableCell></TableRow> : stocks.length === 0 ? <TableRow><TableCell colSpan={7}>No stock purchases found.</TableCell></TableRow> : stocks.map((stock, index) => {
              const id = String(stock.id)
              return <TableRow key={`${id}-${index}`} className="hover:bg-muted/50">
                <TableCell><Link className="block py-1" href={`/stock/purchase/${id}`}>{stock.date ? format(new Date(stock.date), "PPP") : "-"}</Link></TableCell>
                <TableCell className="min-w-[200px]"><Link className="block py-1" href={`/stock/purchase/${id}`}>{stock.companyName || "-"}</Link></TableCell>
                <TableCell className="min-w-[200px]"><Link className="block py-1" href={`/stock/purchase/${id}`}>{stock.repName || "-"}</Link></TableCell>
                <TableCell><Link className="block py-1" href={`/stock/purchase/${id}`}>₦{Number(stock.total || 0).toLocaleString()}</Link></TableCell>
                <TableCell><Link className="block py-1" href={`/stock/purchase/${id}`}>₦{Number(stock.amountPaid || 0).toLocaleString()}</Link></TableCell>
                <TableCell><Link className="block py-1" href={`/stock/purchase/${id}`}>{Number(stock.amountPaid || 0) >= Number(stock.total || 0) ? "✓" : `₦${Number(stock.balance || 0).toLocaleString()}`}</Link></TableCell>
                <TableCell><button type="button" title="Delete stock purchase" className="rounded p-2 text-destructive hover:bg-destructive/10" onClick={() => deletePurchase(id)}><Trash2 className="h-4 w-4" /></button></TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
