"use client"

import { useEffect, useMemo, useState } from "react"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
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

type DailyPoint = {
  date: string
  customers: number
  revenue: number
  grossProfit: number
  expenses: number
  netProfit: number
}
type StockPoint = { name: string; quantity: number }
type AnalyticsData = {
  daily: DailyPoint[]
  stock: StockPoint[]
  summary: {
    customers: number
    revenue: number
    grossProfit: number
    expenses: number
    netProfit: number
    stockUnits: number
  }
}

const toDateInput = (date: Date) => format(date, "yyyy-MM-dd")
const money = (value: number) => `₦${Math.round(value).toLocaleString()}`
const shortDate = (value: string) => format(new Date(`${value}T00:00:00`), "MMM d")
const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
    <div className="mb-5"><h2 className="m-0 text-xl font-medium tracking-tight">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
    {children}
  </section>
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

  useEffect(() => {
    if (!from || !to || from > to) return
    const controller = new AbortController()
    setLoading(true)
    setError("")
    setData(null)
    fetch(`/api/inventory/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Analytics could not be loaded.")
        setData(result)
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return
        setError(fetchError instanceof Error ? fetchError.message : "Analytics could not be loaded.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [from, to])

  const chartData = useMemo(() => (data?.daily ?? []).map((item) => ({ ...item, dateLabel: shortDate(item.date) })), [data])
  const stockData = data?.stock ?? []
  const summary = data?.summary
  const isRangeInvalid = !from || !to || from > to
  const appliedRangeLabel = from === to
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

  return <main className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="mt-1 text-[10px] text-muted-foreground">Revenue minus cost of goods sold</div>
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
          {chartData.length ? <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 4 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={22} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} customers`, "Customers"]} labelFormatter={(label) => `Date: ${label}`} />
                <Line type="monotone" dataKey="customers" stroke="#176b4d" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div> : <EmptyChart label={loading ? "Loading customer data…" : "No customer sales in this date range."} />}
        </ChartPanel>

        <ChartPanel title="Daily revenue" description="Sales totals grouped by the date recorded in the sales ledger.">
          {chartData.length ? <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={22} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(Number(value)), "Revenue"]} labelFormatter={(label) => `Date: ${label}`} />
                <Bar dataKey="revenue" fill="#176b4d" radius={[5, 5, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div> : <EmptyChart label={loading ? "Loading revenue…" : "No revenue in this date range."} />}
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
          {chartData.length ? <div className="h-[280px] w-full">
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
          </div> : <EmptyChart label={loading ? "Loading profit…" : "No profit data in this date range."} />}
        </ChartPanel>

        <ChartPanel title="Current stock by product" description={`On-hand units from recorded stock intake less recorded sales. ${stockData.length} products shown.`}>
          {stockData.length ? <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={112} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString()} units`, "On hand"]} />
                <Bar dataKey="quantity" radius={[0, 5, 5, 0]} maxBarSize={20}>
                  {stockData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.quantity < 0 ? "#dc5b4e" : index === 0 ? "#176b4d" : "#8bb5a0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div> : <EmptyChart label={loading ? "Loading stock levels…" : "No stock intake records found."} />}
        </ChartPanel>
      </div>
      <p className="text-xs text-muted-foreground">Stock reflects recorded purchases minus recorded sales; products with negative stock may indicate missing intake history. Gross profit deducts cost of goods sold using the latest recorded stock cost-per-piece on or before each sale. Net profit further deducts expenses recorded in the expenses ledger, including shared expenses prorated over their date spans. Sale-row cost fields are not used because some contain batch purchase totals rather than unit costs.</p>
  </main>
}