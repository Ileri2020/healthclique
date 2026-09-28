"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { GitMerge } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type UnstockedSale = {
  id: string
  saleId: string
  date?: string | null
  rangeFrom?: string | null
  rangeTo?: string | null
  customerSn?: number | null
  productName: string
  quantity: number
  amount: number
  mode?: "carton" | "pack" | "pcs"
  modeQuantity?: number
  salePrice?: number
  costPrice?: number
  loss?: number
}

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase()
const dateLabel = (sale: UnstockedSale) => sale.date
  ? format(new Date(sale.date), "MMM d, yyyy")
  : sale.rangeFrom && sale.rangeTo
  ? `${format(new Date(sale.rangeFrom), "MMM d, yyyy")} - ${format(new Date(sale.rangeTo), "MMM d, yyyy")}`
  : "-"

export default function UnstockedSalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<UnstockedSale[]>([])
  const [lossSales, setLossSales] = useState<UnstockedSale[]>([])
  const [stockedProducts, setStockedProducts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"unstocked" | "loss">("unstocked")
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [searches, setSearches] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mergingProduct, setMergingProduct] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get("tab") === "loss") setActiveTab("loss")
      const rangeFrom = params.get("from")
      const rangeTo = params.get("to")
      const query = rangeFrom && rangeTo ? `?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}` : ""
      const response = await fetch(`/api/inventory/products/unstocked-sales${query}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Unable to load report")
      setSales(Array.isArray(data.rows) ? data.rows : [])
      setLossSales(Array.isArray(data.lossRows) ? data.lossRows : [])
      setStockedProducts(Array.isArray(data.stockedProducts) ? data.stockedProducts : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadReport() }, [loadReport])

  const productCount = useMemo(() => new Set(sales.map((sale) => normalize(sale.productName))).size, [sales])
  const visibleSales = activeTab === "loss" ? lossSales : sales
  const visibleProductCount = useMemo(() => new Set(visibleSales.map((sale) => normalize(sale.productName))).size, [visibleSales])
  const totalLoss = useMemo(() => lossSales.reduce((sum, sale) => sum + Number(sale.loss || 0), 0), [lossSales])
  const suggestionsFor = (sale: UnstockedSale) => {
    const key = normalize(sale.productName)
    const query = (searches[key] ?? "").trim().toLowerCase()
    if (query.replace(/[^a-z]/g, "").length < 3) return []
    return stockedProducts.filter((product) => product.toLowerCase().includes(query)).slice(0, 10)
  }

  const mergeProduct = async (source: string) => {
    const key = normalize(source)
    const target = targets[key]
    if (!target || normalize(target) === key) {
      toast.error("Choose a different stocked product first")
      return
    }
    if (!window.confirm(`Merge all sales and product references for “${source}” into stocked product “${target}”?`)) return

    setMergingProduct(key)
    try {
      const response = await fetch("/api/inventory/products/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProductName: source, targetProductName: target }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Unable to merge products")
      setSales((current) => current.filter((sale) => normalize(sale.productName) !== key))
      setStockedProducts((current) => current.includes(target) ? current : [...current, target].sort((a, b) => a.localeCompare(b)))
      setTargets((current) => { const next = { ...current }; delete next[key]; return next })
      setSearches((current) => { const next = { ...current }; delete next[key]; return next })
      toast.success(`Merged “${source}” into “${target}”`)
    } catch (mergeError) {
      toast.error(mergeError instanceof Error ? mergeError.message : "Unable to merge products")
    } finally {
      setMergingProduct(null)
    }
  }

  const openSale = (sale: UnstockedSale) => {
    router.push(`/sales?edit=${encodeURIComponent(sale.saleId)}&product=${encodeURIComponent(sale.productName)}`)
  }

  return <main className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Sales inventory check</p>
        <h1 className="text-3xl font-bold">Sales exception report</h1>
        <p className="text-sm text-muted-foreground">Review products sold without stock records or sold below their recorded unit cost.</p>
      </div>
      <Button variant="outline" asChild><Link href="/sales/all">Back to sales</Link></Button>
    </div>

    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sales exception reports">
      <Button type="button" role="tab" aria-selected={activeTab === "unstocked"} variant={activeTab === "unstocked" ? "destructive" : "outline"} onClick={() => setActiveTab("unstocked")}>Sold without stock</Button>
      <Button type="button" role="tab" aria-selected={activeTab === "loss"} variant={activeTab === "loss" ? "destructive" : "outline"} onClick={() => setActiveTab("loss")}>Sold on loss</Button>
    </div>

    <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
      <span><strong>{activeTab === "loss" ? visibleProductCount : productCount}</strong> product names</span>
      <span><strong>{visibleSales.length}</strong> sale lines</span>
      {activeTab === "loss" ? <span>Total below-cost difference: <strong className="text-destructive">₦{totalLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span> : <span><strong>{stockedProducts.length}</strong> stocked merge targets</span>}
    </div>

    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Date</TableHead><TableHead>Customer S/N</TableHead><TableHead>{activeTab === "loss" ? "Product sold below cost" : "Unstocked product"}</TableHead>
          {activeTab === "loss" ? <><TableHead>Mode</TableHead><TableHead>Qty</TableHead><TableHead>Sale price / unit</TableHead><TableHead>Cost / unit</TableHead><TableHead>Loss</TableHead></> : <><TableHead>Quantity</TableHead><TableHead>Amount</TableHead><TableHead className="min-w-[340px]">Merge into stocked product</TableHead></>}
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={activeTab === "loss" ? 8 : 6} className="text-center">Loading {activeTab === "loss" ? "loss" : "unstocked"} sale lines…</TableCell></TableRow>
            : error ? <TableRow><TableCell colSpan={activeTab === "loss" ? 8 : 6} className="text-center text-destructive">{error}</TableCell></TableRow>
            : visibleSales.length === 0 ? <TableRow><TableCell colSpan={activeTab === "loss" ? 8 : 6} className="text-center">{activeTab === "loss" ? "No below-cost sales found for this period." : "No unstocked products found in sales."}</TableCell></TableRow>
            : visibleSales.map((sale) => {
              const key = normalize(sale.productName)
              const suggestions = suggestionsFor(sale)
              return <TableRow
                key={`${sale.saleId}-${sale.id}`}
                role="link"
                tabIndex={0}
                title="Open this sale in edit mode"
                className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openSale(sale)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openSale(sale) }
                }}
              >
                <TableCell className="whitespace-nowrap">{dateLabel(sale)}</TableCell>
                <TableCell>{sale.customerSn ?? "-"}</TableCell>
                <TableCell className="font-medium">{sale.productName}</TableCell>
                {activeTab === "loss" ? <>
                  <TableCell className="capitalize">{sale.mode}</TableCell>
                  <TableCell>{Number(sale.modeQuantity ?? sale.quantity ?? 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(sale.salePrice || 0).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(sale.costPrice || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-destructive">₦{Number(sale.loss || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                </> : <>
                <TableCell>{Number(sale.quantity || 0).toLocaleString()}</TableCell>
                <TableCell>₦{Number(sale.amount || 0).toLocaleString()}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                  <div className="flex min-w-[320px] items-start gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Input
                        aria-label={`Search stocked merge target for ${sale.productName}`}
                        placeholder="Type at least 3 letters"
                        value={searches[key] ?? ""}
                        onFocus={() => setSearches((current) => ({ ...current, [key]: current[key] ?? "" }))}
                        onChange={(event) => {
                          setSearches((current) => ({ ...current, [key]: event.target.value }))
                          setTargets((current) => { const next = { ...current }; delete next[key]; return next })
                        }}
                      />
                      {suggestions.length > 0 ? <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                        {suggestions.map((product) => <button key={product} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => {
                          setTargets((current) => ({ ...current, [key]: product }))
                          setSearches((current) => ({ ...current, [key]: product }))
                        }}>{product}</button>)}
                      </div> : null}
                    </div>
                    <Button type="button" size="sm" variant="destructive" disabled={!targets[key] || mergingProduct === key} onClick={() => void mergeProduct(sale.productName)}>
                      <GitMerge className="mr-1 h-4 w-4" />{mergingProduct === key ? "Merging…" : "Merge"}
                    </Button>
                  </div>
                </TableCell>
                </>}
              </TableRow>
            })}
        </TableBody>
      </Table>
    </div>
  </main>
}
