"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Toaster, toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InventoryColumn, InventoryRow, InventoryTable } from "@/components/inventory-table"

type Props = { mode: "sales" | "stock"; columns: InventoryColumn[] }
const asNumber = (value: unknown) => value === "" || value == null ? 0 : Number(value) || 0

export function InventoryShell({ mode, columns }: Props) {
  const [rows, setRows] = useState<InventoryRow[]>(() => Array.from({ length: 4 }, () => Object.fromEntries(columns.map((column) => [column.key, column.type === "boolean" ? false : ""]))))
  const [products, setProducts] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [rangeFrom, setRangeFrom] = useState("")
  const [rangeTo, setRangeTo] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/inventory/products").then((response) => response.json()).then(setProducts).catch(() => setProducts([])) }, [])
  const value = useMemo(() => rows.reduce((sum, row) => sum + asNumber(row.total), 0), [rows])
  const customerCount = useMemo(() => new Set(rows.map((row) => row.customerSn).filter(Boolean)).size, [rows])
  const updateRows = (nextRows: InventoryRow[]) => setRows(nextRows.map((row) => {
    const cartonQty = asNumber(row.cartonQty), packsPerCarton = asNumber(row.packsPerCarton) || 1, packQty = asNumber(row.packQty), pcsCount = asNumber(row.pcsCount) || 1, pcsQty = asNumber(row.pcsQty)
    const totalPcs = mode === "stock" ? cartonQty * packsPerCarton * pcsCount + packQty * pcsCount + pcsQty : packQty * pcsCount + pcsQty
    const cost = asNumber(row.costPrice), salePrice = Number((cost + .3).toFixed(2))
    const next: InventoryRow = { ...row, totalPcs }
    if (cost > 0 && row.packSalesPrice === "" && (Boolean(row.pack) || packQty > 0)) next.packSalesPrice = salePrice
    if (cost > 0 && row.pcsSalesPrice === "" && (pcsCount > 0 || pcsQty > 0)) next.pcsSalesPrice = salePrice
    next.total = mode === "stock" ? Number((cost * (cartonQty || packQty || pcsQty)).toFixed(2)) : Number((packQty * asNumber(row.packSalesPrice) + pcsQty * asNumber(row.pcsSalesPrice)).toFixed(2))
    return next
  }))
  const blankRows = () => Array.from({ length: 4 }, () => Object.fromEntries(columns.map((column) => [column.key, column.type === "boolean" ? false : ""])))
  const save = async () => {
    const valid = rows.filter((row) => row.productName && (mode === "stock" || row.customerSn))
    if (!valid.length) return toast.error(mode === "sales" ? "Add a product and customer number first." : "Add at least one product first.")
    if (valid.some((row) => !asNumber(row.costPrice) || (!asNumber(row.packSalesPrice) && !asNumber(row.pcsSalesPrice)))) return toast.error("Each row needs a cost price and a sales price.")
    setSaving(true)
    try {
      const response = await fetch(`/api/inventory/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: rangeFrom && rangeTo ? { from: rangeFrom, to: rangeTo } : { date: selectedDate }, rows: valid }) })
      if (!response.ok) throw new Error()
      toast.success(`${mode === "sales" ? "Sales" : "Stock"} saved`)
      setRows(blankRows())
    } catch { toast.error(`Unable to save ${mode}. Check your database connection.`) } finally { setSaving(false) }
  }
  return <div className="workspace"><Toaster position="top-right" /><aside className="sidebar"><div className="brand">health<span>clique</span></div><div className="eyebrow">Operations</div><nav className="nav"><a className={mode === "sales" ? "active" : ""} href="/sales">↗ Sales ledger</a><a className={mode === "stock" ? "active" : ""} href="/stock">＋ Stock intake</a></nav><div className="side-note">A focused workspace for the people keeping every product accounted for.</div></aside><main className="main"><header className="topbar"><div><div className="eyebrow">Inventory desk / {mode}</div><h1>{mode === "sales" ? "Sales, in view." : "Stock, accounted for."}</h1><p className="intro">Capture {mode === "sales" ? "outgoing orders" : "new inventory"} without leaving the ledger.</p></div><div className="date-pill">{format(selectedDate, "EEE, dd MMM yyyy")}</div></header><section className="stats"><div className="stat"><div className="stat-label">Rows ready</div><div className="stat-value">{rows.filter((row) => row.productName).length.toString().padStart(2, "0")}</div></div><div className="stat"><div className="stat-label">Customers today</div><div className="stat-value">{customerCount.toString().padStart(2, "0")}</div></div><div className="stat"><div className="stat-label">Ledger value</div><div className="stat-value">₦{value.toLocaleString()}</div></div></section><section className="panel"><div className="panel-head"><div><h2 className="panel-title">{mode === "sales" ? "Daily sales ledger" : "New stock intake"}</h2><div className="panel-subtitle">Use a date or define a range before saving.</div></div><Button onClick={save} disabled={saving}>{saving ? "Saving..." : `Save ${mode}`}</Button></div><div className="date-controls"><Label>Date <Input type="date" value={format(selectedDate, "yyyy-MM-dd")} onChange={(event) => setSelectedDate(new Date(event.target.value))} /></Label><Label>From <Input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} /></Label><Label>To <Input type="date" value={rangeTo} onChange={(event) => setRangeTo(event.target.value)} /></Label><Button variant="secondary" onClick={() => { setRangeFrom(""); setRangeTo("") }}>Clear range</Button></div><InventoryTable columns={columns} rows={rows} products={products} onRowsChange={updateRows} /></section></main></div>
}