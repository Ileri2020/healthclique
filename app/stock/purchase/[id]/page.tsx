"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Purchase = { id: string; date?: string; total: number; amountPaid: number; stocks: Array<Record<string, string | number | boolean | null | undefined>> }
const fields = [["productName", "Product Name"], ["cartonQty", "Cartons"], ["packsPerCarton", "Packs/Carton"], ["packQty", "Extra Packs"], ["pcsCount", "Pcs/Pack"], ["totalPcs", "Total Pcs"], ["costPrice", "Purchase Cost"], ["cartonSalesPrice", "Carton Price"], ["packSalesPrice", "Pack Price"], ["pcsSalesPrice", "Pcs Price"]] as const

export default function StockPurchasePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  useEffect(() => { fetch(`/api/inventory/stock/${params.id}`).then((response) => response.json()).then(setPurchase) }, [params.id])
  if (!purchase) return <main className="p-6">Loading stock purchase...</main>
  return <main className="space-y-6 p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Saved stock purchase</p><h1 className="text-3xl font-bold">{purchase.date ? format(new Date(purchase.date), "PPP") : "Stock purchase"}</h1></div><Button onClick={() => router.push(`/stock?edit=${purchase.id}`)}>Edit</Button></div><div className="flex flex-wrap gap-4 text-sm"><span>Total: ₦{purchase.total.toLocaleString()}</span><span>Amount paid: ₦{purchase.amountPaid.toLocaleString()}</span><span>Balance: {purchase.amountPaid >= purchase.total ? "✓ Paid in full" : `₦${(purchase.total - purchase.amountPaid).toLocaleString()}`}</span></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow>{fields.map(([, label]) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{purchase.stocks.map((stock, index) => <TableRow key={`${String(stock.id)}-${index}`}>{fields.map(([key]) => <TableCell key={key}>{typeof stock[key] === "boolean" ? (stock[key] ? "Yes" : "No") : stock[key] ?? "-"}</TableCell>)}</TableRow>)}</TableBody></Table></div></main>
}