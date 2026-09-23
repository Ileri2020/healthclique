"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, Calendar as CalendarIcon, Loader2, Plus, Search, Layers, X, GitMerge } from "lucide-react"
import { toast } from "sonner"

type ProductCountItem = {
  productName: string
  availablePieces: number
  shortestExpiry: string | null
  shelfId: string | null
  shelfName: string | null
  packsPerCarton: number
  piecesPerPack: number
  cartonEnabled: boolean
  packEnabled: boolean
  pcsSalesPrice?: number
  packSalesPrice?: number
  cartonSalesPrice?: number
  // Local state fields
  countedPcs?: string | number
  expiryInput?: string
}

type ShelfItem = {
  id: string
  name: string
  number?: string
  rowFrom?: number
  rowTo?: number
  columnFrom?: number
  columnTo?: number
}

function formatPcsToUnits(pcs: number, ppc: number, pCount: number, cartonEnabled: boolean, packEnabled: boolean): string {
  const absPcs = Math.abs(pcs)
  let remaining = absPcs
  let cartons = 0
  let packs = 0

  if (cartonEnabled && ppc > 0 && pCount > 0) {
    cartons = Math.floor(remaining / (ppc * pCount))
    remaining = remaining % (ppc * pCount)
  }

  if (packEnabled && pCount > 0) {
    packs = Math.floor(remaining / pCount)
    remaining = remaining % pCount
  }

  const pieces = remaining
  const parts: string[] = []

  if (cartonEnabled) parts.push(`${cartons} carton${cartons === 1 ? "" : "s"}`)
  if (packEnabled) parts.push(`${packs} pack${packs === 1 ? "" : "s"}`)
  parts.push(`${pieces} pcs`)

  const prefix = pcs < 0 ? "-" : pcs > 0 ? "+" : ""
  return `${prefix}${parts.join(", ")}`
}

export default function StockCountPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductCountItem[]>([])
  const [shelves, setShelves] = useState<ShelfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Header controls state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [selectedShelfFilter, setSelectedShelfFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "shelf" | "price" | "expected" | "status">("name")
  const [countDate, setCountDate] = useState<Date>(new Date())

  // Create Shelf Dialog
  const [createShelfOpen, setCreateShelfOpen] = useState(false)
  const [shelfName, setShelfName] = useState("")
  const [shelfNumber, setShelfNumber] = useState("")
  const [shelfRowFrom, setShelfRowFrom] = useState("")
  const [shelfRowTo, setShelfRowTo] = useState("")
  const [shelfColFrom, setShelfColFrom] = useState("")
  const [shelfColTo, setShelfColTo] = useState("")
  const [savingShelf, setSavingShelf] = useState(false)

  // Merge Product Dialog
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState("")
  const [mergeTargetDropdownOpen, setMergeTargetDropdownOpen] = useState(false)
  const [merging, setMerging] = useState(false)

  // View Stock Counts Date/Range Dialog
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [viewRange, setViewRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })

  useEffect(() => {
    loadCountData()
  }, [])

  const loadCountData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/inventory/count")
      if (!response.ok) throw new Error("Unable to load count data")
      const data = await response.json()
      setProducts(
        (data.products || []).map((p: any) => ({
          ...p,
          countedPcs: "",
          expiryInput: p.shortestExpiry ? p.shortestExpiry.split("T")[0] : "",
        }))
      )
      setShelves(data.shelves || [])
    } catch {
      toast.error("Unable to load stock products")
    } finally {
      setLoading(false)
    }
  }

  const handleShelfCreate = async () => {
    if (!shelfName.trim()) return toast.error("Enter a shelf name")
    setSavingShelf(true)
    try {
      const response = await fetch("/api/inventory/shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shelfName,
          number: shelfNumber,
          rowFrom: shelfRowFrom,
          rowTo: shelfRowTo,
          columnFrom: shelfColFrom,
          columnTo: shelfColTo,
        }),
      })
      if (!response.ok) throw new Error()
      const newShelf = await response.json()
      setShelves((prev) => [...prev, newShelf].sort((a, b) => a.name.localeCompare(b.name)))
      setCreateShelfOpen(false)
      setShelfName("")
      setShelfNumber("")
      setShelfRowFrom("")
      setShelfRowTo("")
      setShelfColFrom("")
      setShelfColTo("")
      toast.success("Shelf created successfully")
    } catch {
      toast.error("Unable to create shelf")
    } finally {
      setSavingShelf(false)
    }
  }

  const handleExpiryChange = async (productName: string, dateStr: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.productName === productName ? { ...p, expiryInput: dateStr } : p))
    )
    if (dateStr) {
      try {
        await fetch("/api/inventory/stock/expiry", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName, expiry: dateStr }),
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleCountChange = (productName: string, val: string) => {
    setSaveState("idle")
    setProducts((prev) =>
      prev.map((p) => (p.productName === productName ? { ...p, countedPcs: val } : p))
    )
  }

  const handleShelfAssign = (productName: string, shelfId: string) => {
    const targetShelf = shelves.find((s) => s.id === shelfId)
    setProducts((prev) =>
      prev.map((p) =>
        p.productName === productName
          ? { ...p, shelfId: targetShelf?.id ?? null, shelfName: targetShelf?.name ?? null }
          : p
      )
    )
  }

  const handleMergeExecute = async () => {
    if (!mergeSource || !mergeTarget.trim()) return toast.error("Select a target product")
    if (mergeSource.toLowerCase() === mergeTarget.trim().toLowerCase()) return toast.error("Select a different product to merge into")
    setMerging(true)
    try {
      const response = await fetch("/api/inventory/products/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProductName: mergeSource, targetProductName: mergeTarget.trim() }),
      })
      if (!response.ok) throw new Error()
      toast.success(`Merged '${mergeSource}' into '${mergeTarget.trim()}'`)
      setMergeDialogOpen(false)
      setMergeSource(null)
      setMergeTarget("")
      loadCountData()
    } catch {
      toast.error("Unable to merge products")
    } finally {
      setMerging(false)
    }
  }

  const handleSaveStockCount = async () => {
    setSaving(true)
    setSaveState("saving")
    try {
      const lines = products.map((p) => {
        const cVal = p.countedPcs !== "" && p.countedPcs !== undefined && p.countedPcs !== null ? Number(p.countedPcs) : undefined
        return {
          productName: p.productName,
          shelfName: p.shelfName || undefined,
          shelfId: p.shelfId || undefined,
          expectedPcs: p.availablePieces,
          countedPcs: cVal,
          expiry: p.expiryInput ? new Date(p.expiryInput).toISOString() : undefined,
        }
      })

      const response = await fetch("/api/inventory/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: countDate.toISOString(),
          shelfName: selectedShelfFilter !== "all" ? selectedShelfFilter : undefined,
          lines,
        }),
      })

      if (!response.ok) throw new Error()
      setSaveState("saved")
      toast.success("Stock count session saved successfully")
    } catch {
      setSaveState("error")
      toast.error("Unable to save stock count session")
    } finally {
      setSaving(false)
    }
  }

  // Filter & Search suggestions
  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (query.length < 3) return []
    return products.filter((p) => p.productName.toLowerCase().includes(query)).slice(0, 10)
  }, [searchTerm, products])

  const mergeTargetSuggestions = useMemo(() => {
    const query = mergeTarget.trim().toLowerCase()
    if (query.length < 3) return []
    return products
      .filter((p) => p.productName !== mergeSource && p.productName.toLowerCase().includes(query))
      .slice(0, 8)
  }, [mergeTarget, mergeSource, products])

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    const query = searchTerm.trim().toLowerCase()
    if (query) {
      list = list.filter((p) => p.productName.toLowerCase().includes(query))
    }

    if (selectedShelfFilter !== "all") {
      list = list.filter((p) => (p.shelfName || "Unassigned") === selectedShelfFilter)
    }

    // Sort items:
    // 1. Uncounted items stay on top; counted items move to the bottom.
    // 2. Secondary sort based on `sortBy`.
    list.sort((a, b) => {
      const aHasCount = a.countedPcs !== "" && a.countedPcs !== undefined && a.countedPcs !== null
      const bHasCount = b.countedPcs !== "" && b.countedPcs !== undefined && b.countedPcs !== null

      if (!aHasCount && bHasCount) return -1
      if (aHasCount && !bHasCount) return 1

      if (sortBy === "name") return a.productName.localeCompare(b.productName)
      if (sortBy === "shelf") return (a.shelfName || "ZZZ").localeCompare(b.shelfName || "ZZZ")
      if (sortBy === "expected") return b.availablePieces - a.availablePieces
      if (sortBy === "price") return (b.pcsSalesPrice || 0) - (a.pcsSalesPrice || 0)
      if (sortBy === "status") {
        const aDiff = aHasCount ? Number(a.countedPcs) - a.availablePieces : 0
        const bDiff = bHasCount ? Number(b.countedPcs) - b.availablePieces : 0
        return aDiff - bDiff
      }
      return a.productName.localeCompare(b.productName)
    })

    return list
  }, [products, searchTerm, selectedShelfFilter, sortBy])

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Inventory physical audit</p>
          <h1 className="text-3xl font-bold">Stock count</h1>
          <p className="text-sm text-muted-foreground">Record shelf counts, verify expiry dates, and analyze stock differences.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" type="button" onClick={() => setCreateShelfOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create shelf
          </Button>
          <Button variant="outline" type="button" onClick={() => setDateRangeOpen(true)}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            View stock counts
          </Button>
          <Button variant="outline" asChild>
            <Link href="/stock">Back to stock</Link>
          </Button>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-4 items-end rounded-lg border bg-card p-4">
        <div className="relative md:col-span-2">
          <Label htmlFor="top-search" className="text-sm font-semibold">Search product</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="top-search"
              className="pl-9"
              placeholder="Type product name (3+ letters)..."
              value={searchTerm}
              onFocus={() => { if (searchTerm.trim().length >= 3) setSearchDropdownOpen(true) }}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setSearchDropdownOpen(e.target.value.trim().length >= 3)
              }}
              onBlur={() => { setTimeout(() => setSearchDropdownOpen(false), 150) }}
            />
          </div>
          {searchDropdownOpen && searchSuggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {searchSuggestions.map((item) => (
                <button
                  key={item.productName}
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSearchTerm(item.productName)
                    setSearchDropdownOpen(false)
                  }}
                >
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">{item.shelfName || "No shelf"}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <Label htmlFor="shelf-filter" className="text-sm font-semibold">Filter shelf</Label>
          <select
            id="shelf-filter"
            className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={selectedShelfFilter}
            onChange={(e) => setSelectedShelfFilter(e.target.value)}
          >
            <option value="all">All shelves</option>
            {shelves.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} {s.number ? `(#${s.number})` : ""}
              </option>
            ))}
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>

        <div>
          <Label htmlFor="sort-by" className="text-sm font-semibold">Sort by</Label>
          <select
            id="sort-by"
            className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Product name</option>
            <option value="shelf">Shelf name</option>
            <option value="expected">Expected quantity</option>
            <option value="price">Sales price</option>
            <option value="status">Difference status</option>
          </select>
        </div>
      </div>

      {/* Action & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="count-date" className="whitespace-nowrap text-sm font-semibold">Count date:</Label>
          <input
            id="count-date"
            type="date"
            className="rounded border bg-transparent px-3 py-1.5 text-sm"
            value={format(countDate, "yyyy-MM-dd")}
            onChange={(e) => setCountDate(new Date(`${e.target.value}T00:00:00`))}
          />
          <span className="text-xs text-muted-foreground">({filteredProducts.length} products listed)</span>
        </div>
        <Button onClick={handleSaveStockCount} disabled={saving || saveState === "saved"}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          {saveState === "saved" ? "Saved" : "Save stock count"}
        </Button>
      </div>

      {/* Main Table */}
      <div className="w-full max-w-full overflow-x-auto touch-pan-x touch-pan-y scrollbar-thin [webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] rounded-lg border">
        <Table className="bg-foreground/10 min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S/N</TableHead>
              <TableHead className="w-16 text-center">Merge</TableHead>
              <TableHead className="w-[240px]">Product name</TableHead>
              <TableHead className="w-[160px]">Shelf</TableHead>
              <TableHead className="w-[150px]">Shortest expiry</TableHead>
              <TableHead className="w-[220px]">Expected quantity</TableHead>
              <TableHead className="w-[120px]">Count (Pcs)</TableHead>
              <TableHead className="w-[220px]">Difference</TableHead>
              <TableHead className="w-[120px]">Sales price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Loading stock count products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No stock products found for audit.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p, index) => {
                const hasCount = p.countedPcs !== "" && p.countedPcs !== undefined && p.countedPcs !== null
                const countNum = hasCount ? Number(p.countedPcs) : null
                const diffPcs = countNum !== null ? countNum - p.availablePieces : null

                const expectedFormatted = formatPcsToUnits(p.availablePieces, p.packsPerCarton, p.piecesPerPack, p.cartonEnabled, p.packEnabled)
                const diffFormatted = diffPcs !== null ? formatPcsToUnits(diffPcs, p.packsPerCarton, p.piecesPerPack, p.cartonEnabled, p.packEnabled) : "-"

                const isLower = diffPcs !== null && diffPcs < 0
                const isExceeded = diffPcs !== null && diffPcs > 0

                return (
                  <TableRow key={p.productName} className={hasCount ? "bg-muted/30" : "hover:bg-muted/40"}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`Merge ${p.productName}`}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMergeSource(p.productName)
                            setMergeTarget("")
                            setMergeDialogOpen(true)
                            e.target.checked = false
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.productName}</TableCell>
                    <TableCell>
                      <select
                        className="w-full rounded border bg-transparent px-2 py-1 text-xs"
                        value={p.shelfId || ""}
                        onChange={(e) => handleShelfAssign(p.productName, e.target.value)}
                      >
                        <option value="">Select shelf</option>
                        {shelves.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.number ? `(#${s.number})` : ""}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="date"
                        className="w-full rounded border bg-transparent px-2 py-1 text-xs"
                        value={p.expiryInput || ""}
                        onChange={(e) => handleExpiryChange(p.productName, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{expectedFormatted}</div>
                      <div className="text-[11px] text-muted-foreground">({p.availablePieces.toLocaleString()} Pcs total)</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Count pcs"
                        className="h-8 text-xs font-semibold"
                        value={p.countedPcs ?? ""}
                        onChange={(e) => handleCountChange(p.productName, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {diffPcs === null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className={isLower ? "text-red-500 font-bold" : isExceeded ? "text-emerald-500 font-bold" : "text-foreground font-semibold"}>
                          {diffFormatted} ({diffPcs > 0 ? `+${diffPcs}` : diffPcs} Pcs)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.pcsSalesPrice ? `₦${p.pcsSalesPrice.toLocaleString()}/pc` : p.packSalesPrice ? `₦${p.packSalesPrice.toLocaleString()}/pk` : "-"}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal 1: Create Shelf */}
      <Dialog open={createShelfOpen} onOpenChange={setCreateShelfOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create shelf</DialogTitle>
            <DialogDescription>Add a new shelf object to organize stock products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div>
              <Label htmlFor="new-shelf-name">Shelf name *</Label>
              <Input id="new-shelf-name" value={shelfName} onChange={(e) => setShelfName(e.target.value)} placeholder="e.g. Shelf A" />
            </div>
            <div>
              <Label htmlFor="new-shelf-num">Shelf number</Label>
              <Input id="new-shelf-num" value={shelfNumber} onChange={(e) => setShelfNumber(e.target.value)} placeholder="e.g. 01" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="row-from">Row from</Label>
                <Input id="row-from" type="number" value={shelfRowFrom} onChange={(e) => setShelfRowFrom(e.target.value)} placeholder="2" />
              </div>
              <div>
                <Label htmlFor="row-to">Row to</Label>
                <Input id="row-to" type="number" value={shelfRowTo} onChange={(e) => setShelfRowTo(e.target.value)} placeholder="3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="col-from">Column from</Label>
                <Input id="col-from" type="number" value={shelfColFrom} onChange={(e) => setShelfColFrom(e.target.value)} placeholder="1" />
              </div>
              <div>
                <Label htmlFor="col-to">Column to</Label>
                <Input id="col-to" type="number" value={shelfColTo} onChange={(e) => setShelfColTo(e.target.value)} placeholder="4" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleShelfCreate} disabled={savingShelf}>
              {savingShelf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Merge Product Confirmation */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-amber-500" />
              Merge product records
            </DialogTitle>
            <DialogDescription>
              Merge all previous DB stock and sales records of <strong className="text-foreground">{mergeSource}</strong> into another target product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Label htmlFor="merge-target-input">Target product name (3+ letters)</Label>
              <Input
                id="merge-target-input"
                className="mt-1"
                placeholder="Search target product..."
                value={mergeTarget}
                onFocus={() => { if (mergeTarget.trim().length >= 3) setMergeTargetDropdownOpen(true) }}
                onChange={(e) => {
                  setMergeTarget(e.target.value)
                  setMergeTargetDropdownOpen(e.target.value.trim().length >= 3)
                }}
                onBlur={() => { setTimeout(() => setMergeTargetDropdownOpen(false), 150) }}
              />
              {mergeTargetDropdownOpen && mergeTargetSuggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  {mergeTargetSuggestions.map((item) => (
                    <button
                      key={item.productName}
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-accent"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setMergeTarget(item.productName)
                        setMergeTargetDropdownOpen(false)
                      }}
                    >
                      {item.productName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <strong>Warning:</strong> Are you sure you truly want to merge <em>{mergeSource}</em> into <em>{mergeTarget || "selected target"}</em>? This will update all previous stock and sales entries in the database to prevent duplicate product listings.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleMergeExecute} disabled={merging || !mergeTarget.trim()}>
              {merging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: View Stock Counts Dialog */}
      <Dialog open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>View saved stock counts</DialogTitle>
            <DialogDescription>Select a date or date range to inspect saved stock count sessions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div>
              <Label htmlFor="count-single-date">Single date</Label>
              <input
                id="count-single-date"
                type="date"
                className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm"
                value={format(viewDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  setViewDate(new Date(`${e.target.value}T00:00:00`))
                  setViewRange({ from: undefined, to: undefined })
                }}
              />
            </div>
            <div>
              <Label htmlFor="count-range-from">Range from</Label>
              <input
                id="count-range-from"
                type="date"
                className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm"
                value={viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => setViewRange((prev) => ({ ...prev, from: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined }))}
              />
            </div>
            <div>
              <Label htmlFor="count-range-to">Range to</Label>
              <input
                id="count-range-to"
                type="date"
                className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm"
                value={viewRange.to ? format(viewRange.to, "yyyy-MM-dd") : ""}
                onChange={(e) => setViewRange((prev) => ({ ...prev, to: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { router.push("/count/all"); setDateRangeOpen(false) }}>
              All
            </Button>
            <Button
              type="button"
              onClick={() => {
                const from = viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""
                const to = viewRange.to ? format(viewRange.to, "yyyy-MM-dd") : ""
                router.push(from && to ? `/count/${from}_to_${to}` : `/count/${format(viewDate, "yyyy-MM-dd")}`)
                setDateRangeOpen(false)
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
