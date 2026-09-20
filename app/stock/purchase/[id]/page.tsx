"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"

type Purchase = { id: string; date?: string; total: number; amountPaid: number; stocks: TableRow[] }

const stockColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", className: "w-10" },
  { key: "productName", label: "Product Name", type: "text" },
  { key: "carton", label: "Carton", type: "boolean", className: "w-28", conditionalFields: [{ key: "cartonQty", label: "Carton Qty" }, { key: "packsPerCarton", label: "Packs/Carton" }] },
  { key: "pack", label: "Pack", type: "boolean", className: "w-28", conditionalFields: [{ key: "packQty", label: "Pack Qty" }, { key: "pcsCount", label: "Pcs/Pack" }] },
  { key: "totalPcs", label: "Total Pcs", type: "number", className: "w-28" },
  { key: "costPrice", label: "Purchase Cost", type: "number", className: "w-32" },
  { key: "wholesale", label: "Wholesale", type: "boolean", className: "w-24" },
  { key: "cartonSalesPrice", label: "Carton Sales Price", type: "number", className: "w-36" },
  { key: "packSalesPrice", label: "Pack Sales Price", type: "number", className: "w-36" },
  { key: "pcsSalesPrice", label: "Pcs Sales Price", type: "number", className: "w-36" },
]

export default function StockPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [purchase, setPurchase] = useState<Purchase | null>(null)

  useEffect(() => {
    fetch(`/api/inventory/stock/${id}`)
      .then((response) => response.json())
      .then(setPurchase)
  }, [id])

  if (!purchase) return <main className="p-6">Loading stock purchase...</main>

  return <main className="space-y-6 p-6">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Saved stock purchase</p><h1 className="text-3xl font-bold">{purchase.date ? format(new Date(purchase.date), "PPP") : "Stock purchase"}</h1></div>
      <Button onClick={() => router.push(`/stock?edit=${purchase.id}`)}>Edit</Button>
    </div>
    <div className="flex flex-wrap gap-4 text-sm"><span>Total: ₦{purchase.total.toLocaleString()}</span><span>Amount paid: ₦{purchase.amountPaid.toLocaleString()}</span><span>Balance: {purchase.amountPaid >= purchase.total ? "✓ Paid in full" : `₦${(purchase.total - purchase.amountPaid).toLocaleString()}`}</span></div>
    <div className="rounded-lg border bg-card p-2 sm:p-4 max-w-full">
      <Tables columns={stockColumns} rows={purchase.stocks} showTotals minWidth="1050px" readOnly />
    </div>
  </main>
}
