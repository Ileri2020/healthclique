"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

type ProductAvailability = {
  productName: string
  expiry?: string | null
  availablePieces: number
  cartons: number
  packs: number
  pieces: number
  packsPerCarton: number
  piecesPerPack: number
}

type ProductHistoryEntry = {
  id: string
  date?: string | null
  rangeFrom?: string | null
  rangeTo?: string | null
  companyName?: string
  repName?: string
  rows: Array<Record<string, string | number | boolean | null | undefined>>
}

export default function StockProductsPage() {
  const [products, setProducts] = useState<ProductAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [history, setHistory] = useState<{ stocks: ProductHistoryEntry[]; sales: ProductHistoryEntry[] }>({ stocks: [], sales: [] })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [productNames, setProductNames] = useState<string[]>([])
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameFrom, setRenameFrom] = useState("")
  const [renameTo, setRenameTo] = useState("")
  const [renameSaving, setRenameSaving] = useState(false)
  const pageSize = 30

  useEffect(() => {
    fetch("/api/inventory/products/availability")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load products")
        return response.json()
      })
      .then(setProducts)
      .catch(() => setError("Unable to load stock products."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/inventory/products")
      .then((response) => response.json())
      .then((data) => setProductNames(Array.isArray(data) ? data : []))
      .catch(() => setProductNames([]))
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return query ? products.filter((product) => product.productName.toLowerCase().includes(query)) : products
  }, [products, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, 5, totalPages]
    if (currentPage >= totalPages - 2) return [1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, totalPages]
  }, [currentPage, totalPages])

  useEffect(() => setCurrentPage(1), [searchTerm])
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!selectedProduct) return
    setHistoryLoading(true)
    fetch(`/api/inventory/products/history?productName=${encodeURIComponent(selectedProduct)}`)
      .then((response) => response.json())
      .then((data) => setHistory({ stocks: data.stocks ?? [], sales: data.sales ?? [] }))
      .finally(() => setHistoryLoading(false))
  }, [selectedProduct])

  const historyDate = (entry: ProductHistoryEntry) => entry.date
    ? format(new Date(entry.date), "MMM d, yyyy")
    : entry.rangeFrom && entry.rangeTo
    ? `${format(new Date(entry.rangeFrom), "MMM d, yyyy")} - ${format(new Date(entry.rangeTo), "MMM d, yyyy")}`
    : "-"

  const updateStockExpiry = async (stockId: string, expiry: string) => {
    const response = await fetch(`/api/inventory/stock/${stockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiry }),
    })
    if (!response.ok) throw new Error("Unable to update expiry")
    setHistory((current) => ({
      ...current,
      stocks: current.stocks.map((entry) => ({
        ...entry,
        rows: entry.rows.map((row) => String(row.id) === stockId ? { ...row, expiry: expiry || null } : row),
      })),
    }))
    const availabilityResponse = await fetch("/api/inventory/products/availability")
    if (availabilityResponse.ok) setProducts(await availabilityResponse.json())
  }

  const renameSuggestions = renameTo.replace(/[^a-zA-Z]/g, "").length >= 4
    ? productNames.filter((name) => name.toLowerCase().includes(renameTo.toLowerCase())).slice(0, 8)
    : []

  const renameProduct = async () => {
    const nextName = renameTo.trim()
    if (!nextName || nextName === renameFrom) return toast.error("Enter a different product name.")
    setRenameSaving(true)
    try {
      const response = await fetch("/api/inventory/products/rename", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName: renameFrom, newName: nextName }) })
      if (!response.ok) throw new Error()
      setProducts((current) => current.map((product) => product.productName === renameFrom ? { ...product, productName: nextName } : product))
      if (selectedProduct === renameFrom) setSelectedProduct(nextName)
      setRenameOpen(false)
      toast.success("Product name updated across stock and sales")
    } catch {
      toast.error("Unable to rename product")
    } finally {
      setRenameSaving(false)
    }
  }

  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Inventory overview</p><h1 className="text-3xl font-bold">Stock products</h1><p className="text-sm text-muted-foreground">Available quantity after recorded sales.</p></div>
      <Button variant="outline" asChild><Link href="/stock">Back to stock</Link></Button>
    </div>
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-sm mx-auto">
        <Input placeholder="Search stock products..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="max-w-md" />
        <span className="text-sm text-muted-foreground">{filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="bg-foreground/20 max-w-xl mx-auto rounded-lg">
          <TableHeader><TableRow><TableHead className="w-12">S/N</TableHead><TableHead className="w-[200px] min-w-[200px] max-w-[200px]">Product name</TableHead><TableHead>Available quantity</TableHead><TableHead className="max-w-[100px]">Total pieces</TableHead><TableHead>Expiry</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="justify-center items-center text-center">Loading stock products...</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={5} className="justify-center items-center text-center">{error}</TableCell></TableRow> : filteredProducts.length === 0 ? <TableRow><TableCell colSpan={5} className="justify-center items-center text-center">No stock products found.</TableCell></TableRow> : visibleProducts.map((product, index) => <TableRow key={product.productName} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProduct(product.productName)}>
              <TableCell className="justify-center items-center text-center">{(currentPage - 1) * pageSize + index + 1}</TableCell>
              <TableCell className="w-[200px] min-w-[200px] max-w-[200px] font-medium justify-center items-center text-center"><div className="flex items-center justify-center gap-1"><span className="truncate">{product.productName}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" title={`Edit ${product.productName}`} onClick={(event) => { event.stopPropagation(); setRenameFrom(product.productName); setRenameTo(product.productName); setRenameOpen(true) }}><Pencil className="h-3.5 w-3.5" /></Button></div></TableCell>
              <TableCell className="justify-center items-center text-center">{product.cartons} carton{product.cartons === 1 ? "" : "s"}, {product.packs} pack{product.packs === 1 ? "" : "s"}, {product.pieces} pcs</TableCell>
              <TableCell className="max-w-[100px] truncate justify-center items-center text-center">{product.availablePieces.toLocaleString()}</TableCell>
              <TableCell className="justify-center items-center text-center">{product.expiry ? format(new Date(product.expiry), "MMM d, yyyy") : "-"}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      {filteredProducts.length > pageSize ? <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</Button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            const previousPage = pageNumbers[index - 1]
            const needsEllipsis = index > 0 && page - previousPage > 1
            return <span key={page} className="flex items-center gap-1">{needsEllipsis ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}<Button variant={page === currentPage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(page)} aria-label={`Go to page ${page}`}>{page}</Button></span>
          })}
        </div>
        <Button variant="outline" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</Button>
      </div> : null}
    </div>
    <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{selectedProduct}</DialogTitle><DialogDescription>Saved stock and sales records for this product.</DialogDescription></DialogHeader>
        <Tabs defaultValue="stock">
          <TabsList><TabsTrigger value="stock">Stock</TabsTrigger><TabsTrigger value="sales">Sales</TabsTrigger></TabsList>
          <TabsContent value="stock"><HistoryList entries={history.stocks} loading={historyLoading} type="stock" productName={selectedProduct ?? ""} historyDate={historyDate} onExpiryChange={updateStockExpiry} /></TabsContent>
          <TabsContent value="sales"><HistoryList entries={history.sales} loading={historyLoading} type="sale" productName={selectedProduct ?? ""} historyDate={historyDate} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit product name</DialogTitle><DialogDescription>This renames every saved stock and sales reference for this product.</DialogDescription></DialogHeader>
        <div className="relative space-y-2 py-3"><Input autoFocus value={renameTo} onChange={(event) => setRenameTo(event.target.value)} placeholder="Product name" />{renameSuggestions.length > 0 ? <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-popover p-1 shadow-md">{renameSuggestions.map((name) => <button key={name} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onMouseDown={(event) => { event.preventDefault(); setRenameTo(name) }}>{name}</button>)}</div> : null}</div>
        <DialogFooter><Button type="button" onClick={renameProduct} disabled={renameSaving}>{renameSaving ? "Saving..." : "Save name"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
}

function HistoryList({ entries, loading, type, productName, historyDate, onExpiryChange }: { entries: ProductHistoryEntry[]; loading: boolean; type: "stock" | "sale"; productName: string; historyDate: (entry: ProductHistoryEntry) => string; onExpiryChange?: (stockId: string, expiry: string) => Promise<void> }) {
  if (loading) return <p className="py-6 text-sm text-muted-foreground">Loading history...</p>
  if (!entries.length) return <p className="py-6 text-sm text-muted-foreground">No saved {type} records for this product.</p>
  if (type === "stock") return <StockHistoryTable entries={entries} historyDate={historyDate} onExpiryChange={onExpiryChange} />
  return <div className="space-y-2 pt-3">{entries.map((entry) => <Link key={entry.id} href={`/sales?edit=${entry.id}&product=${encodeURIComponent(productName)}`} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50"><span>{historyDate(entry)}</span><span>{entry.rows.length} row{entry.rows.length === 1 ? "" : "s"}</span><span className="font-medium">Edit</span></Link>)}</div>
}

function StockHistoryTable({ entries, historyDate, onExpiryChange }: { entries: ProductHistoryEntry[]; historyDate: (entry: ProductHistoryEntry) => string; onExpiryChange?: (stockId: string, expiry: string) => Promise<void> }) {
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const stockRows = entries.flatMap((entry) => entry.rows.map((row) => ({ entry, row })))

  const expiryValue = (value: string | number | boolean | null | undefined) => {
    if (!value) return ""
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
  }

  const saveExpiry = async (stockId: string, expiry: string) => {
    if (!onExpiryChange) return
    setSavingRowId(stockId)
    try {
      await onExpiryChange(stockId, expiry)
      toast.success("Expiry date updated")
    } catch {
      toast.error("Unable to update expiry date")
    } finally {
      setSavingRowId(null)
    }
  }

  return <div className="overflow-x-auto pt-3"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Company</TableHead><TableHead>Representative</TableHead><TableHead>Quantity</TableHead><TableHead>Expiry</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{stockRows.map(({ entry, row }) => {
    const stockId = String(row.id)
    return <TableRow key={stockId}><TableCell className="justify-center items-center text-center">{historyDate(entry)}</TableCell><TableCell className="justify-center items-center text-center">{entry.companyName || "-"}</TableCell><TableCell className="justify-center items-center text-center">{entry.repName || "-"}</TableCell><TableCell className="justify-center items-center text-center">{String(row.totalPcs ?? row.qty ?? "-")}</TableCell><TableCell className="justify-center items-center text-center"><Input type="date" defaultValue={expiryValue(row.expiry)} disabled={savingRowId === stockId} onBlur={(event) => { if (event.currentTarget.value !== expiryValue(row.expiry)) void saveExpiry(stockId, event.currentTarget.value) }} className="min-w-[145px]" /></TableCell><TableCell className="justify-center items-center text-center"><Link href={`/stock?edit=${entry.id}&product=${encodeURIComponent(String(row.productName ?? ""))}`} className="font-medium hover:underline">Edit</Link></TableCell></TableRow>
  })}</TableBody></Table></div>
}
