"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"

type SaleRecord = { id: string; date?: string; rangeFrom?: string; rangeTo?: string; paymentMethod?: string; cashPaid?: number; posPayment?: number; change?: number; sales: TableRow[] }

const salesColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", className: "w-10" },
  { key: "productName", label: "Product Name", type: "text" },
  { key: "carton", label: "Carton", type: "boolean", conditionalFields: [{ key: "cartonQty", label: "Carton Qty" }] },
  { key: "pack", label: "Pack", type: "boolean", conditionalFields: [{ key: "packQty", label: "Pack Qty" }] },
  { key: "pcsQty", label: "Pcs Qty", type: "number" },
  { key: "totalPcs", label: "Total Pcs", type: "number", readOnly: true },
  { key: "wholesale", label: "Wholesale", type: "boolean" },
  { key: "salesPrice", label: "Sales Price", type: "number" },
  { key: "total", label: "Total Price", type: "number", readOnly: true },
]

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [record, setRecord] = useState<SaleRecord | null>(null)
  const [rows, setRows] = useState<TableRow[]>([])
  const [customerName, setCustomerName] = useState("")

  useEffect(() => {
    fetch(`/api/inventory/sales/${id}`).then((response) => response.json()).then((data) => {
      setRecord(data)
      setRows((data.sales ?? []).map((row: TableRow) => ({
        ...row,
        carton: Boolean(row.carton),
        cartonQty: row.cartonQty ?? "",
        packsPerCarton: row.packsPerCarton ?? "",
        pack: Boolean(row.pack),
        packQty: row.packQty ?? "",
        pcsCount: row.pcsCount ?? "",
        pcsQty: row.pcsQty ?? "",
        totalPcs: row.totalPcs ?? "",
        salesPrice: row.price ?? row.packSalesPrice ?? row.pcsSalesPrice ?? "",
      })))
      setCustomerName(data.sales?.[0]?.customerName ?? "")
    }).catch(() => toast.error("Unable to load sales"))
  }, [id])

  if (!record) return <main className="p-6">Loading sales...</main>
  const heading = record.date ? format(new Date(record.date), "PPP") : record.rangeFrom && record.rangeTo ? `${format(new Date(record.rangeFrom), "PPP")} - ${format(new Date(record.rangeTo), "PPP")}` : "Saved sales"

  return <main className="space-y-6 p-6">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Saved sales</p><h1 className="text-3xl font-bold">{heading}</h1></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => router.back()}>Back</Button><Button onClick={() => router.push(`/sales?edit=${id}`)}>Edit</Button></div>
    </div>
    <div className="flex flex-wrap items-end gap-4 text-sm">
      <div className="space-y-1"><Label htmlFor="sale-customer">Customer name</Label><Input id="sale-customer" value={customerName} readOnly /></div>
      <span>Payment: {record.paymentMethod || "-"}</span><span>Cash: ₦{Number(record.cashPaid || 0).toLocaleString()}</span><span>POS: ₦{Number(record.posPayment || 0).toLocaleString()}</span><span>Change: ₦{Number(record.change || 0).toLocaleString()}</span>
    </div>
    <div className="rounded-lg border bg-card p-2 sm:p-4 overflow-x-auto max-w-full"><Tables columns={salesColumns} rows={rows} showTotals minWidth="1200px" readOnly /></div>
  </main>
}
