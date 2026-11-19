"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { CalendarDays, GitMerge, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

type DailyPoint = {
  date: string
  customers: number
  revenue: number
  grossProfit: number
  expenses: number
  netProfit: number
}
type ProductSalesPoint = { name: string; revenue: number; quantity: number; grossProfit: number }
type StockPoint = { name: string; quantity: number }
type StockSalesPrices = {
  name: string
  pcsSalesPrice?: number
  packSalesPrice?: number
  cartonSalesPrice?: number
}
type StockPurchasePoint = { companyName: string; total: number; orders: number }
type StockPurchaseDatePoint = {
  date: string
  dateLabel: string
  companyName: string
  total: number
  orders: number
}
type UnstockedProduct = {
  name: string
  lastSalePrice: number
  revenue: number
}
type AnalyticsData = {
  daily: DailyPoint[]
  stock: StockPoint[]
  products: ProductSalesPoint[]
  stockSalesPrices: StockSalesPrices[]
  stockPurchases: StockPurchasePoint[]
  stockPurchasesByDate: StockPurchaseDatePoint[]
  unstockedProducts: UnstockedProduct[]
  summary: {
    customers: number
    revenue: number
    grossProfit: number
    expenses: number
    netProfit: number
    stockUnits: number
    stockPurchaseTotal: number
    stockPurchaseCount: number
  }
}

const toDateInput = (date: Date) => format(date, "yyyy-MM-dd")
const money = (value: number) => `₦${Math.round(value).toLocaleString()}`
const shortDate = (value: string) => format(new Date(`${value}T00:00:00`), "MMM d")

const SUPPLIER_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#84cc16", // lime
  "#e11d48", // rose
  "#a855f7", // violet
  "#0ea5e9", // sky
  "#d97706", // warm amber
]

function getSupplierColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % SUPPLIER_COLORS.length
  return SUPPLIER_COLORS[index]
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="m-0 text-xl font-medium tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{label}</div>
}

export default function InventoryAnalyticsPage() {
  const [from, setFrom] = useState(() => toDateInput(startOfMonth(new Date())))
  const [to, setTo] = useState(() => toDateInput(new Date()))
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<"month" | "range">("month")
  const [draftMonth, setDraftMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [draftFrom, setDraftFrom] = useState(() => toDateInput(startOfMonth(new Date())))
  const [draftTo, setDraftTo] = useState(() => toDateInput(new Date()))
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Stock purchases chart options
  const [stockSortMode, setStockSortMode] = useState<"date" | "supplier">("date")

  // Product sales chart mode and visible range
  const [productMetric, setProductMetric] = useState<"revenue" | "quantity" | "grossProfit">("revenue")
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null)

  // Unstocked products table search & merge state
  const [unstockedSearch, setUnstockedSearch] = useState("")
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState("")
  const [mergeTargetDropdownOpen, setMergeTargetDropdownOpen] = useState(false)
  const [merging, setMerging] = useState(false)
  const [allProducts, setAllProducts] = useState<string[]>([])

  const fetchAnalytics = useCallback(async (signal?: AbortSignal) => {
    if (!from || !to || from > to) return
    setLoading(true)
    setError("")
    try {
      const response = await fetch(
        `/api/inventory/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
          cache: "no-store",
          signal,
        }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Analytics could not be loaded.")
      setData(result)
    } catch (fetchError: unknown) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return
      setError(fetchError instanceof Error ? fetchError.message : "Analytics could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    const controller = new AbortController()
    fetchAnalytics(controller.signal)
    return () => controller.abort()
  }, [fetchAnalytics])

  // Fetch product names for merge autocomplete
  useEffect(() => {
    fetch("/api/inventory/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((names: string[]) => {
        if (Array.isArray(names)) setAllProducts(names)
      })
      .catch(() => {})
  }, [])

  const chartData = useMemo(
    () => (data?.daily ?? []).map((item) => ({ ...item, dateLabel: shortDate(item.date) })),
    [data]
  )
  const productSalesData = useMemo(
    () => [...(data?.products ?? [])].sort((a, b) =>
      b[productMetric] - a[productMetric] || a.name.localeCompare(b.name)
    ),
    [data, productMetric]
  )
  const visibleProductData = showAllProducts ? productSalesData : productSalesData.slice(0, 30)
  const selectedProduct = productSalesData.find((product) => product.name === selectedProductName)
  const productMetricLabel = productMetric === "revenue"
    ? "Total amount sold"
    : productMetric === "quantity"
      ? "Quantity sold"
      : "Total profit"
  const productMetricValue = (product: ProductSalesPoint) =>
    productMetric === "quantity" ? `${product.quantity.toLocaleString()} units` : money(product[productMetric])
  const stockPurchasesData = data?.stockPurchases ?? []
  const stockPurchasesByDateData = useMemo(() => {
    return (data?.stockPurchasesByDate ?? []).map((item) => ({
      ...item,
      dateLabel: shortDate(item.date),
    }))
  }, [data])

  const unstockedProducts = useMemo(() => {
    const list = data?.unstockedProducts ?? []
    if (!unstockedSearch.trim()) return list
    const q = unstockedSearch.trim().toLowerCase()
    return list.filter((p) => p.name.toLowerCase().includes(q))
  }, [data, unstockedSearch])

  const mergeTargetSuggestions = useMemo(() => {
    const query = mergeTarget.trim().toLowerCase()
    if (query.length < 2) return []
    return allProducts
      .filter((name) => name !== mergeSource && name.toLowerCase().includes(query))
      .slice(0, 8)
  }, [mergeTarget, mergeSource, allProducts])
  const mergeTargetPrices = useMemo(() => {
    return new Map(
      (data?.stockSalesPrices ?? []).map((prices) => [prices.name.trim().toLowerCase(), prices])
    )
  }, [data])

  const summary = data?.summary
  const isRangeInvalid = !from || !to || from > to
  const appliedRangeLabel =
    from === to
      ? format(new Date(`${from}T00:00:00`), "MMM d, yyyy")
      : `${format(new Date(`${from}T00:00:00`), "MMM d, yyyy")} – ${format(new Date(`${to}T00:00:00`), "MMM d, yyyy")}`

  const openDateFilter = () => {
    setDraftFrom(from)
    setDraftTo(to)
    setDraftMonth(format(new Date(`${from}T00:00:00`), "yyyy-MM"))
    setFilterMode("month")
    setFilterOpen(true)
  }

  const applyDateFilter = () => {
    if (filterMode === "month") {
      if (!draftMonth) return
      const monthDate = new Date(`${draftMonth}-01T00:00:00`)
      if (Number.isNaN(monthDate.getTime())) return
      setFrom(toDateInput(startOfMonth(monthDate)))
      setTo(toDateInput(endOfMonth(monthDate)))
    } else {
      if (!draftFrom || !draftTo || draftFrom > draftTo) return
      setFrom(draftFrom)
      setTo(draftTo)
    }
    setFilterOpen(false)
  }

  const handleOpenMerge = (productName: string) => {
    setMergeSource(productName)
    setMergeTarget("")
    setMergeDialogOpen(true)
  }

  const handleMergeExecute = async () => {
    if (!mergeSource || !mergeTarget.trim()) {
      toast.error("Select a target product")
      return
    }
    if (mergeSource.toLowerCase() === mergeTarget.trim().toLowerCase()) {
      toast.error("Select a different product to merge into")
      return
    }
    setMerging(true)
    try {
      const response = await fetch("/api/inventory/products/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceProductName: mergeSource,
          targetProductName: mergeTarget.trim(),
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || "Unable to merge products")
      }
      toast.success(`Merged '${mergeSource}' into '${mergeTarget.trim()}'`)
      setMergeDialogOpen(false)
      setMergeSource(null)
      setMergeTarget("")
      // Reload analytics to refresh calculations and unstocked list
      fetchAnalytics()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to merge products")
    } finally {
      setMerging(false)
    }
  }

  // Unique suppliers in the current dataset for legend display
  const currentSuppliers = useMemo(() => {
    const map = new Map<string, string>()
    stockPurchasesData.forEach((sp) => {
      map.set(sp.companyName, getSupplierColor(sp.companyName))
    })
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }))
  }, [stockPurchasesData])

  return (
    <main className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Inventory / Analytics</p>
          <h1 className="mb-2 mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Inventory analytics</h1>
          <p className="text-sm text-muted-foreground">Daily customers, sales performance and stock position at a glance.</p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={openDateFilter}>
          <CalendarDays className="h-4 w-4" />
          <span>{appliedRangeLabel}</span>
          <span className="text-muted-foreground">· Change filter</span>
        </Button>
      </header>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose analytics period</DialogTitle>
            <DialogDescription>View a full calendar month or choose any date range, including spans across months.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button type="button" variant={filterMode === "month" ? "default" : "outline"} onClick={() => setFilterMode("month")}>Select month</Button>
            <Button type="button" variant={filterMode === "range" ? "default" : "outline"} onClick={() => setFilterMode("range")}>Date range</Button>
          </div>
          {filterMode === "month" ? (
            <label className="grid gap-2 text-sm font-medium" htmlFor="analytics-month">
              Month
              <input id="analytics-month" type="month" className="w-full rounded-md border bg-background px-3 py-2" value={draftMonth} onChange={(event) => setDraftMonth(event.target.value)} />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium" htmlFor="analytics-range-from">
                From
                <input id="analytics-range-from" type="date" className="min-w-0 rounded-md border bg-background px-3 py-2" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="analytics-range-to">
                To
                <input id="analytics-range-to" type="date" className="min-w-0 rounded-md border bg-background px-3 py-2" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
              </label>
            </div>
          )}
          {filterMode === "range" && draftFrom && draftTo && draftFrom > draftTo ? <p role="alert" className="text-sm text-destructive">The end date must be on or after the start date.</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFilterOpen(false)}>Cancel</Button>
            <Button type="button" onClick={applyDateFilter} disabled={filterMode === "month" ? !draftMonth : !draftFrom || !draftTo || draftFrom > draftTo}>Apply filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customers in range</div>
          <div className="mt-3 text-3xl font-semibold">{loading ? "—" : (summary?.customers ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sales revenue</div>
          <div className="mt-3 text-3xl font-semibold">{loading ? "—" : money(summary?.revenue ?? 0)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gross profit</div>
          <div className="mt-1 text-[10px] text-muted-foreground">Revenue minus cost of goods sold (skips unstocked items)</div>
          <div className={`mt-2 text-3xl font-semibold ${!loading && (summary?.grossProfit ?? 0) < 0 ? "text-red-600" : ""}`}>
            {loading ? "—" : money(summary?.grossProfit ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Net profit</div>
          <div className="mt-1 text-[10px] text-muted-foreground">Gross profit minus expenses ({loading ? "…" : money(summary?.expenses ?? 0)})</div>
          <div className={`mt-2 text-3xl font-semibold ${!loading && (summary?.netProfit ?? 0) < 0 ? "text-red-600" : ""}`}>
            {loading ? "—" : money(summary?.netProfit ?? 0)}
          </div>
        </div>
      </section>

      {isRangeInvalid ? <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Choose a valid date range: the start date must be on or before the end date.</p> : null}
      {error ? <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading && !data ? <p className="mb-4 text-sm text-[#6b786f]">Loading analytics…</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Daily customers" description="Unique customer numbers recorded each day in the selected range.">
          {chartData.length ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 4 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={22} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} customers`, "Customers"]} labelFormatter={(label) => `Date: ${label}`} />
                  <Line type="monotone" dataKey="customers" stroke="#176b4d" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label={loading ? "Loading customer data…" : "No customer sales in this date range."} />
          )}
        </ChartPanel>

        <ChartPanel title="Daily revenue" description="Sales totals grouped by the date recorded in the sales ledger.">
          {chartData.length ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={22} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(Number(value)), "Revenue"]} labelFormatter={(label) => `Date: ${label}`} />
                  <Bar dataKey="revenue" fill="#176b4d" radius={[5, 5, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label={loading ? "Loading revenue…" : "No revenue in this date range."} />
          )}
        </ChartPanel>

        <ChartPanel title="Daily profit" description="Gross profit (revenue − COGS) and net profit (gross − expenses) per day.">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total net profit · {appliedRangeLabel}</p>
              <p className={`mt-1 text-2xl font-semibold ${!loading && (summary?.netProfit ?? 0) < 0 ? "text-red-600" : "text-foreground"}`}>
                {loading ? "Loading…" : money(summary?.netProfit ?? 0)}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Gross profit: {loading ? "—" : money(summary?.grossProfit ?? 0)}</p>
              <p>Expenses: {loading ? "—" : money(summary?.expenses ?? 0)}</p>
            </div>
          </div>
          {chartData.length ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={22} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [money(Number(value)), name === "grossProfit" ? "Gross profit" : "Net profit"]} labelFormatter={(label) => `Date: ${label}`} />
                  <Bar dataKey="grossProfit" name="grossProfit" fill="#8bb5a0" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="netProfit" name="netProfit" fill="#f28f52" radius={[5, 5, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label={loading ? "Loading profit…" : "No profit data in this date range."} />
          )}
        </ChartPanel>

        <ChartPanel
          title="Product sales by product"
          description={`${productMetricLabel} in ${appliedRangeLabel}. ${visibleProductData.length.toLocaleString()} of ${productSalesData.length.toLocaleString()} products shown.`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Label className="flex items-center gap-2 text-xs font-medium">
              Graph mode
              <select
                aria-label="Product graph mode"
                className="rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                value={productMetric}
                onChange={(event) => setProductMetric(event.target.value as typeof productMetric)}
              >
                <option value="revenue">Total amount sold</option>
                <option value="quantity">Quantity sold</option>
                <option value="grossProfit">Total profit</option>
              </select>
            </Label>
            {selectedProduct ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Selected product: <span className="font-medium text-foreground">{selectedProduct.name}</span>
                {" · "}{productMetricLabel}: {productMetricValue(selectedProduct)}
              </p>
            ) : null}
          </div>
          {productSalesData.length ? (
            <>
              <div className="max-h-[60vh] overflow-y-auto rounded-md">
                <div className="w-full" style={{ height: Math.max(280, visibleProductData.length * 30 + 36) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleProductData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickFormatter={(value) => productMetric === "quantity"
                          ? Number(value).toLocaleString()
                          : value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`}
                      />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const product = payload[0].payload as ProductSalesPoint
                          return (
                            <div className="rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
                              <p className="font-semibold text-foreground">{product.name}</p>
                              <p className="mt-1 text-muted-foreground">
                                {productMetricLabel}: <strong className="text-foreground">{productMetricValue(product)}</strong>
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey={productMetric}
                        radius={[0, 5, 5, 0]}
                        maxBarSize={20}
                        cursor="pointer"
                        onClick={(_, index) => setSelectedProductName(visibleProductData[index]?.name ?? null)}
                      >
                        {visibleProductData.map((product, index) => (
                          <Cell
                            key={`${product.name}-${index}`}
                            fill={product[productMetric] < 0 ? "#dc5b4e" : index === 0 ? "#176b4d" : "#8bb5a0"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {productSalesData.length > 30 ? (
                <div className="mt-3 flex justify-center">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAllProducts((showAll) => !showAll)}>
                    {showAllProducts ? "Show top 30 products" : `Show all ${productSalesData.length.toLocaleString()} products`}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyChart label={loading ? "Loading product sales…" : "No product sales in this date range."} />
          )}
        </ChartPanel>

        {/* Stock Purchases Chart with Date/Supplier Switch and Distinct Colors */}
        <div className="xl:col-span-2">
          <ChartPanel
            title="Stock purchases"
            description={
              stockSortMode === "date"
                ? `Purchases ordered by date. Supplier names shown in description.`
                : `Purchases grouped by supplier for ${appliedRangeLabel}.`
            }
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total stock orders · {appliedRangeLabel}</p>
                <p className="mt-1 text-2xl font-semibold">{loading ? "Loading…" : money(summary?.stockPurchaseTotal ?? 0)}</p>
              </div>

              {/* Toggle switch for ordering by Date vs Supplier */}
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="stock-sort-toggle" className="cursor-pointer text-xs font-medium">
                    {stockSortMode === "date" ? "Ordered by Date" : "Grouped by Supplier"}
                  </Label>
                  <Switch
                    id="stock-sort-toggle"
                    checked={stockSortMode === "supplier"}
                    onCheckedChange={(checked) => setStockSortMode(checked ? "supplier" : "date")}
                  />
                  <span className="text-xs text-muted-foreground">
                    (Switch to {stockSortMode === "date" ? "Suppliers" : "Date"})
                  </span>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {loading ? "—" : `${(summary?.stockPurchaseCount ?? 0).toLocaleString()} orders · ${stockPurchasesData.length.toLocaleString()} suppliers`}
                </p>
              </div>
            </div>

            {/* Supplier color badges legend */}
            {currentSuppliers.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Suppliers:</span>
                {currentSuppliers.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            ) : null}

            {stockSortMode === "date" ? (
              stockPurchasesByDateData.length ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockPurchasesByDateData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickFormatter={(value) => value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload as StockPurchaseDatePoint
                            return (
                              <div className="rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
                                <p className="font-semibold text-foreground">{p.dateLabel} ({p.date})</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: getSupplierColor(p.companyName) }}
                                  />
                                  <span className="font-medium text-foreground">Supplier: {p.companyName}</span>
                                </div>
                                <p className="mt-1 text-muted-foreground">Amount: <strong className="text-foreground">{money(p.total)}</strong></p>
                                <p className="text-[11px] text-muted-foreground">{p.orders} order(s)</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="total" radius={[5, 5, 0, 0]} maxBarSize={32}>
                        {stockPurchasesByDateData.map((entry, index) => (
                          <Cell
                            key={`date-bar-${entry.date}-${entry.companyName}-${index}`}
                            fill={getSupplierColor(entry.companyName)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label={loading ? "Loading stock purchases…" : "No stock purchases in this date range."} />
              )
            ) : (
              stockPurchasesData.length ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockPurchasesData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickFormatter={(value) => value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="companyName"
                        width={132}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload as StockPurchasePoint
                            return (
                              <div className="rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: getSupplierColor(p.companyName) }}
                                  />
                                  <span>{p.companyName}</span>
                                </div>
                                <p className="mt-1 text-muted-foreground">Total: <strong className="text-foreground">{money(p.total)}</strong></p>
                                <p className="text-[11px] text-muted-foreground">{p.orders} order(s)</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="total" radius={[0, 5, 5, 0]} maxBarSize={22}>
                        {stockPurchasesData.map((entry, index) => (
                          <Cell
                            key={`supplier-bar-${entry.companyName}-${index}`}
                            fill={getSupplierColor(entry.companyName)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label={loading ? "Loading stock purchases…" : "No stock purchases in this date range."} />
              )
            )}
          </ChartPanel>
        </div>
      </div>

      {/* LAST SECTION: Unstocked Products (Cost Price = 0) Datatable with Merge */}
      <section className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium tracking-tight">Products with zero cost price (Never Stocked)</h2>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {unstockedProducts.length} product{unstockedProducts.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These products were sold during this period but have no recorded stock intake or cost price (cost = ₦0).
              Their sales are excluded from gross and net profit calculations to keep your profit accurate.
              Use the <strong>Merge</strong> button to merge any duplicates into a recognized stocked product.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter unstocked products..."
              className="pl-9 text-xs"
              value={unstockedSearch}
              onChange={(e) => setUnstockedSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12 text-center text-xs">#</TableHead>
                <TableHead className="text-xs">Product Name</TableHead>
                <TableHead className="text-xs">Last Sold Unit Sales Price</TableHead>
                <TableHead className="text-right text-xs">Revenue Generated</TableHead>
                <TableHead className="w-28 text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading unstocked products…
                    </div>
                  </TableCell>
                </TableRow>
              ) : unstockedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    {unstockedSearch ? "No matching unstocked products found." : "No unstocked products found in this date range. All sold items have recorded cost prices!"}
                  </TableCell>
                </TableRow>
              ) : (
                unstockedProducts.map((product, index) => (
                  <TableRow key={`${product.name}-${index}`}>
                    <TableCell className="text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                    <TableCell className="text-sm font-semibold">{money(product.lastSalePrice)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{money(product.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                        onClick={() => handleOpenMerge(product.name)}
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                        <span>Merge</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Merge Product Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-amber-500" />
              Merge unstocked product
            </DialogTitle>
            <DialogDescription>
              Merge all previous stock and sales records of <strong className="text-foreground">{mergeSource}</strong> into another target product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Label htmlFor="analytics-merge-target">Target product name (2+ letters)</Label>
              <Input
                id="analytics-merge-target"
                className="mt-1"
                placeholder="Search target product name..."
                value={mergeTarget}
                onFocus={() => { if (mergeTarget.trim().length >= 2) setMergeTargetDropdownOpen(true) }}
                onChange={(e) => {
                  setMergeTarget(e.target.value)
                  setMergeTargetDropdownOpen(e.target.value.trim().length >= 2)
                }}
                onBlur={() => { setTimeout(() => setMergeTargetDropdownOpen(false), 200) }}
              />
              {mergeTargetDropdownOpen && mergeTargetSuggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  {mergeTargetSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-accent"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setMergeTarget(name)
                        setMergeTargetDropdownOpen(false)
                      }}
                    >
                      {name}
                      {(() => {
                        const prices = mergeTargetPrices.get(name.trim().toLowerCase())
                        if (!prices) return null
                        const labels = [
                          prices.pcsSalesPrice != null ? `${money(prices.pcsSalesPrice)}/pc` : null,
                          prices.packSalesPrice != null ? `${money(prices.packSalesPrice)}/pack` : null,
                          prices.cartonSalesPrice != null ? `${money(prices.cartonSalesPrice)}/carton` : null,
                        ].filter((price): price is string => price !== null)
                        return labels.length ? <span className="ml-1 text-muted-foreground">· {labels.join(" · ")}</span> : null
                      })()}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <strong>Warning:</strong> Are you sure you want to merge <em>{mergeSource}</em> into <em>{mergeTarget || "selected target"}</em>?
              This will update all previous stock and sales entries in the database to prevent duplicate product listings and ensure future cost calculation succeeds.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleMergeExecute}
              disabled={merging || !mergeTarget.trim()}
            >
              {merging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Stock reflects recorded purchases minus recorded sales; products with negative stock may indicate missing intake history.
        Gross profit deducts cost of goods sold using the latest recorded stock cost-per-piece on or before each sale, and skips products with ₦0 cost price.
        Net profit further deducts expenses recorded in the expenses ledger, including shared expenses prorated over their date spans.
      </p>
    </main>
  )
}