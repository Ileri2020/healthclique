"use client"

import { use, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { toast } from "sonner"

type CountLine = { id: string; productName: string; expectedPcs: number; countedPcs?: number | null; difference?: number; packsPerCarton?: number; pcsCount?: number; normalizedPcs?: number | null }
type Count = { id: string; date: string; shelf?: { name: string; number?: string | null } | null; lines: CountLine[]; totalLines: number; countedLines: number }

const differenceLabel = (difference: number, packsPerCarton = 0, pcsCount = 0) => {
  let remaining = Math.abs(difference)
  const cartonSize = Math.max(1, packsPerCarton * pcsCount)
  const cartons = Math.floor(remaining / cartonSize)
  remaining %= cartonSize
  const packs = Math.floor(remaining / Math.max(1, pcsCount))
  const pieces = remaining % Math.max(1, pcsCount)
  return { text: `${difference > 0 ? "+" : difference < 0 ? "-" : ""}${cartons} carton${cartons === 1 ? "" : "s"}, ${packs} pack${packs === 1 ? "" : "s"}, ${pieces} pcs`, className: difference < 0 ? "text-danger" : difference > 0 ? "text-accent" : "text-foreground" }
}

export default function StockCountHistoryPage({ params }: { params: Promise<{ range: string }> }) {
  const token = use(params).range
  const [counts, setCounts] = useState<Count[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Count | null>(null)
  const isAdmin = useIsAdmin()
  const [from, to] = token === "all" ? ["", ""] : token.includes("_to_") ? token.split("_to_") : [token, token]

  const loadCounts = () => {
    setLoading(true)
    fetch(`/api/inventory/stock-counts${from ? `?from=${from}&to=${to}` : ""}`)
      .then((response) => response.json())
      .then((data) => setCounts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadCounts() }, [from, to])

  const heading = token === "all" ? "All stock counts" : from === to ? format(new Date(`${from}T00:00:00`), "PPP") : `${format(new Date(`${from}T00:00:00`), "PPP")} - ${format(new Date(`${to}T00:00:00`), "PPP")}`

  const selectedLines = useMemo(() => selected?.lines ?? [], [selected])
  const normalize = async (lineId?: string) => {
    if (!selected) return
    const response = await fetch(`/api/inventory/stock-counts/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: lineId ? "normalize" : "normalize-all", lineId }) })
    if (!response.ok) return toast.error("Admin access is required to normalize")
    toast.success(lineId ? "Product normalized" : "All products normalized")
    const detail = await fetch(`/api/inventory/stock-counts/${selected.id}`).then((result) => result.json())
    setSelected((current) => current ? { ...current, lines: detail.lines } : current)
  }

  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Inventory audit history</p><h1 className="text-3xl font-bold">{heading}</h1></div><Button variant="outline" asChild><Link href="/stock/count">New stock count</Link></Button></div>
    <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Shelf</TableHead><TableHead>Products</TableHead><TableHead>Counted</TableHead><TableHead>Open</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5}>Loading counts...</TableCell></TableRow> : counts.length === 0 ? <TableRow><TableCell colSpan={5}>No stock counts found.</TableCell></TableRow> : counts.map((count) => <TableRow key={count.id} className="cursor-pointer" onClick={() => setSelected(count)}><TableCell>{format(new Date(count.date), "PPP")}</TableCell><TableCell>{count.shelf?.name || "-"}</TableCell><TableCell>{count.totalLines}</TableCell><TableCell>{count.countedLines}</TableCell><TableCell><Button type="button" variant="outline" onClick={(event) => { event.stopPropagation(); setSelected(count) }}>View count</Button></TableCell></TableRow>)}</TableBody></Table></div>
    {selected ? <section className="space-y-4 rounded-lg border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Count from {format(new Date(selected.date), "PPP")}</h2><p className="text-sm text-muted-foreground">{selected.shelf?.name || "No shelf assigned"}</p></div>{isAdmin ? <Button onClick={() => normalize()}>Normalize all</Button> : null}</div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Expected</TableHead><TableHead>Counted</TableHead><TableHead>Difference</TableHead><TableHead>Normalized</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{selectedLines.map((line) => { const difference = line.difference ?? ((line.countedPcs ?? line.expectedPcs) - line.expectedPcs); const diff = differenceLabel(difference, line.packsPerCarton, line.pcsCount); return <TableRow key={line.id}><TableCell>{line.productName}</TableCell><TableCell>{line.expectedPcs.toLocaleString()}</TableCell><TableCell>{line.countedPcs == null ? "-" : line.countedPcs.toLocaleString()}</TableCell><TableCell className={diff.className}>{line.countedPcs == null ? "-" : diff.text}</TableCell><TableCell>{line.normalizedPcs == null ? "-" : line.normalizedPcs.toLocaleString()}</TableCell><TableCell>{isAdmin ? <Button variant="outline" size="sm" onClick={() => normalize(line.id)}>Normalize</Button> : null}</TableCell></TableRow> })}</TableBody></Table></div></section> : null}
  </main>
}
