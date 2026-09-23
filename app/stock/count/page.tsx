"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type CountProduct = {
  productName: string
  productKey: string
  expectedPcs: number
  expiry?: string | null
  packsPerCarton: number
  pcsCount: number
  salesPrice?: number | null
  countedPcs?: number | null
}

type Shelf = { id: string; name: string; number?: string | null; rowFrom?: number | null; rowTo?: number | null; columnFrom?: number | null; columnTo?: number | null }

const differenceLabel = (difference: number, packsPerCarton: number, pcsCount: number) => {
  const sign = difference > 0 ? "+" : difference < 0 ? "-" : ""
  let remaining = Math.abs(difference)
  const cartonSize = Math.max(1, packsPerCarton * pcsCount)
  const cartons = Math.floor(remaining / cartonSize)
  remaining %= cartonSize
  const packs = Math.floor(remaining / Math.max(1, pcsCount))
  const pieces = remaining % Math.max(1, pcsCount)
  return { text: `${sign}${cartons} carton${cartons === 1 ? "" : "s"}, ${packs} pack${packs === 1 ? "" : "s"}, ${pieces} pcs`, className: difference < 0 ? "text-destructive" : difference > 0 ? "text-accent" : "text-foreground" }
}

export default function StockCountPage() {
  const [products, setProducts] = useState<CountProduct[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("count")
  const [countDate, setCountDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [shelfId, setShelfId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shelfOpen, setShelfOpen] = useState(false)
  const [shelfForm, setShelfForm] = useState({ name: "", number: "", rowFrom: "", rowTo: "", columnFrom: "", columnTo: "" })
  const [mergeSource, setMergeSource] = useState<CountProduct | null>(null)
  const [mergeSearch, setMergeSearch] = useState("")
  const [mergeTarget, setMergeTarget] = useState<CountProduct | null>(null)

  const loadProducts = () => {
    setLoading(true)
    fetch("/api/inventory/stock-counts?mode=products")
      .then((response) => response.json())
      .then((data) => { setProducts(data.products ?? []); setShelves(data.shelves ?? []) })
      .catch(() => toast.error("Unable to load count products"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query.length >= 3 ? products.filter((product) => product.productName.toLowerCase().includes(query)).slice(0, 8) : []
  }, [products, search])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query.length >= 3 ? products.filter((product) => product.productName.toLowerCase().includes(query)) : products
    return [...filtered].sort((left, right) => {
      const leftCounted = left.countedPcs != null
      const rightCounted = right.countedPcs != null
      if (sortBy === "count") {
        if (leftCounted !== rightCounted) return leftCounted ? 1 : -1
        return left.productName.localeCompare(right.productName)
      }
      if (sortBy === "name") return left.productName.localeCompare(right.productName)
      if (sortBy === "price") return Number(right.salesPrice || 0) - Number(left.salesPrice || 0)
      if (sortBy === "shelf") return left.productName.localeCompare(right.productName)
      return 0
    })
  }, [products, search, sortBy])

  const updateProduct = (productKey: string, update: Partial<CountProduct>) => setProducts((current) => current.map((product) => product.productKey === productKey ? { ...product, ...update } : product))

  const saveShelf = async () => {
    const response = await fetch("/api/inventory/shelves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shelfForm) })
    if (!response.ok) return toast.error("Unable to create shelf")
    const shelf = await response.json()
    setShelves((current) => [...current, shelf])
    setShelfId(shelf.id)
    setShelfOpen(false)
    setShelfForm({ name: "", number: "", rowFrom: "", rowTo: "", columnFrom: "", columnTo: "" })
    toast.success("Shelf created")
  }

  const saveCount = async () => {
    const rows = products.filter((product) => product.countedPcs != null || product.expiry).map((product) => ({ productName: product.productName, productKey: product.productKey, expectedPcs: product.expectedPcs, countedPcs: product.countedPcs, expiry: product.expiry ? new Date(product.expiry).toISOString().slice(0, 10) : "" }))
    if (!rows.length) return toast.error("Enter at least one stock count")
    setSaving(true)
    try {
      const response = await fetch("/api/inventory/stock-counts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: countDate, shelfId: shelfId || undefined, rows }) })
      if (!response.ok) throw new Error()
      toast.success("Stock count saved")
      loadProducts()
    } catch { toast.error("Unable to save stock count") } finally { setSaving(false) }
  }

  const mergeProduct = async () => {
    if (!mergeSource || !mergeTarget || !window.confirm(`Merge ${mergeSource.productName} into ${mergeTarget.productName}? This changes all saved stock, sales, and count records.`)) return
    const response = await fetch("/api/inventory/stock-counts/merge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceProductName: mergeSource.productName, targetProductName: mergeTarget.productName }) })
    if (!response.ok) return toast.error("Unable to merge products")
    toast.success("Products merged")
    setMergeSource(null)
    setMergeTarget(null)
    setMergeSearch("")
    loadProducts()
  }

  return <main className="space-y-6 p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Inventory audit</p><h1 className="text-3xl font-bold">Stock count</h1><p className="text-sm text-muted-foreground">Count physical stock by product and shelf.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/stock/count/all">View counts</Link></Button><Button variant="outline" onClick={() => setShelfOpen(true)}>Create shelf</Button><Button onClick={saveCount} disabled={saving}>{saving ? "Saving..." : "Save count"}</Button></div>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-[280px] flex-1"><Label htmlFor="count-search">Search product</Label><Input id="count-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type at least 3 letters" />{suggestions.length > 0 ? <div className="absolute left-0 right-0 top-full z-20 rounded-md border bg-popover p-1 shadow-md">{suggestions.map((product) => <button key={product.productKey} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onMouseDown={(event) => { event.preventDefault(); setSearch(product.productName) }}>{product.productName}</button>)}</div> : null}</div>
      <div><Label htmlFor="count-date">Count date</Label><Input id="count-date" type="date" value={countDate} onChange={(event) => setCountDate(event.target.value)} /></div>
      <div><Label htmlFor="count-shelf">Shelf</Label><select id="count-shelf" className="h-10 rounded-md border bg-background px-3 text-sm" value={shelfId} onChange={(event) => setShelfId(event.target.value)}><option value="">No shelf</option>{shelves.map((shelf) => <option key={shelf.id} value={shelf.id}>{shelf.name}{shelf.number ? ` (${shelf.number})` : ""}</option>)}</select></div>
      <div><Label htmlFor="count-sort">Sort by</Label><select id="count-sort" className="h-10 rounded-md border bg-background px-3 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="count">Uncounted first</option><option value="name">Name</option><option value="price">Sales price</option><option value="shelf">Shelf</option></select></div>
      <Button variant="outline" asChild><Link href="/stock/products">View stock</Link></Button>
    </div>
    <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Expected stock</TableHead><TableHead>Expiry</TableHead><TableHead>Sales price</TableHead><TableHead>Count</TableHead><TableHead>Difference</TableHead><TableHead>Merge</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7}>Loading products...</TableCell></TableRow> : visibleProducts.length === 0 ? <TableRow><TableCell colSpan={7}>No products found.</TableCell></TableRow> : visibleProducts.map((product) => { const count = product.countedPcs == null ? null : Number(product.countedPcs); const difference = count == null ? 0 : count - product.expectedPcs; const diff = differenceLabel(difference, product.packsPerCarton, product.pcsCount); return <TableRow key={product.productKey}><TableCell className="font-medium">{product.productName}</TableCell><TableCell>{product.expectedPcs.toLocaleString()} pcs</TableCell><TableCell><Input type="date" value={product.expiry ? new Date(product.expiry).toISOString().slice(0, 10) : ""} onChange={(event) => updateProduct(product.productKey, { expiry: event.target.value || null })} /></TableCell><TableCell>₦{Number(product.salesPrice || 0).toLocaleString()}</TableCell><TableCell><Input type="number" min="0" value={product.countedPcs == null ? "" : product.countedPcs} onChange={(event) => updateProduct(product.productKey, { countedPcs: event.target.value === "" ? null : Number(event.target.value) })} /></TableCell><TableCell className={count == null ? "text-muted-foreground" : diff.className}>{count == null ? "Not counted" : diff.text}</TableCell><TableCell><input type="checkbox" aria-label={`Merge ${product.productName}`} checked={mergeSource?.productKey === product.productKey} onChange={() => { setMergeSource(product); setMergeTarget(null); setMergeSearch("") }} /></TableCell></TableRow> })}</TableBody></Table></div>
    <Dialog open={mergeSource !== null} onOpenChange={(open) => !open && setMergeSource(null)}><DialogContent><DialogHeader><DialogTitle>Merge product</DialogTitle><DialogDescription>Choose the product that should keep the saved stock and sales history.</DialogDescription></DialogHeader><div className="space-y-3"><p className="text-sm">Source: <strong>{mergeSource?.productName}</strong></p><Input value={mergeSearch} onChange={(event) => setMergeSearch(event.target.value)} placeholder="Search target product" />{mergeSearch.trim().length >= 3 ? <div className="max-h-48 overflow-y-auto rounded border p-1">{products.filter((product) => product.productKey !== mergeSource?.productKey && product.productName.toLowerCase().includes(mergeSearch.toLowerCase())).map((product) => <button key={product.productKey} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => setMergeTarget(product)}>{product.productName}</button>)}</div> : null}{mergeTarget ? <p className="text-sm">Target: <strong>{mergeTarget.productName}</strong></p> : null}</div><DialogFooter><Button variant="outline" onClick={() => setMergeSource(null)}>Cancel</Button><Button disabled={!mergeTarget} onClick={mergeProduct}>Confirm merge</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={shelfOpen} onOpenChange={setShelfOpen}><DialogContent><DialogHeader><DialogTitle>Create shelf</DialogTitle><DialogDescription>Define a shelf name, number, and optional row and column range.</DialogDescription></DialogHeader><div className="grid gap-3 py-3">{([['name','Shelf name'],['number','Shelf number'],['rowFrom','Row from'],['rowTo','Row to'],['columnFrom','Column from'],['columnTo','Column to']] as const).map(([key, label]) => <div key={key}><Label htmlFor={`shelf-${key}`}>{label}</Label><Input id={`shelf-${key}`} type={key === 'name' || key === 'number' ? 'text' : 'number'} value={shelfForm[key]} onChange={(event) => setShelfForm((current) => ({ ...current, [key]: event.target.value }))} /></div>)}</div><DialogFooter><Button variant="outline" onClick={() => setShelfOpen(false)}>Cancel</Button><Button onClick={saveShelf}>Create shelf</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
