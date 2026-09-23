"use client"

import { use, useCallback, useEffect, useState } from "react"
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
import { Calendar as CalendarIcon, CheckCircle2, Loader2, ShieldCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useIsAdmin } from "@/hooks/useIsAdmin"

type CountLine = {
  id: string
  productName: string
  shelfName?: string | null
  expectedPcs: number
  countedPcs?: number | null
  differencePcs?: number | null
  expiry?: string | null
  normalizedPcs?: number | null
  normalizedAt?: string | null
  packsPerCarton?: number | null
  piecesPerPack?: number | null
}

type StockCountSession = {
  id: string
  date: string
  shelfName?: string | null
  normalized: boolean
  normalizedAt?: string | null
  lines: CountLine[]
}

function formatDiffToUnits(pcs: number, packsPerCarton?: number | null, piecesPerPack?: number | null): string {
  const absPcs = Math.abs(pcs)
  const prefix = pcs < 0 ? "-" : pcs > 0 ? "+" : ""
  const ppc = packsPerCarton && packsPerCarton > 0 ? packsPerCarton : 0
  const pip = piecesPerPack && piecesPerPack > 0 ? piecesPerPack : 0

  if (ppc > 0 && pip > 0) {
    const cartons = Math.floor(absPcs / (ppc * pip))
    const rem1 = absPcs % (ppc * pip)
    const packs = Math.floor(rem1 / pip)
    const pcs2 = rem1 % pip
    const parts: string[] = []
    if (cartons > 0) parts.push(`${cartons} carton${cartons === 1 ? "" : "s"}`)
    if (packs > 0) parts.push(`${packs} pack${packs === 1 ? "" : "s"}`)
    if (pcs2 > 0 || parts.length === 0) parts.push(`${pcs2} pcs`)
    return `${prefix}${parts.join(", ")}`
  }
  if (pip > 0) {
    const packs = Math.floor(absPcs / pip)
    const pcs2 = absPcs % pip
    const parts: string[] = []
    if (packs > 0) parts.push(`${packs} pack${packs === 1 ? "" : "s"}`)
    if (pcs2 > 0 || parts.length === 0) parts.push(`${pcs2} pcs`)
    return `${prefix}${parts.join(", ")}`
  }
  return `${prefix}${absPcs} pcs`
}

export default function StockCountRangePage({ params }: { params: Promise<{ range: string }> }) {
  const router = useRouter()
  const { range } = use(params)
  const [sessions, setSessions] = useState<StockCountSession[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = useIsAdmin()
  const [normalizing, setNormalizing] = useState<string | null>(null)
  const [normalizingAll, setNormalizingAll] = useState(false)

  // Range filter dialog
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [viewRange, setViewRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      let url = "/api/inventory/count/range?"
      if (range === "all") {
        url += "history=true"
      } else if (range.includes("_to_")) {
        const [from, to] = range.split("_to_")
        url += `from=${from}&to=${to}`
      } else {
        url += `date=${range}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error()
      const data = await response.json()

      if (range === "all" && Array.isArray(data)) {
        // Fetch full session details for all summary items
        const fullSessions = await Promise.all(
          data.map(async (item: any) => {
            const res = await fetch(`/api/inventory/count/range?id=${item.id}`)
            return res.ok ? res.json() : null
          })
        )
        setSessions(fullSessions.filter(Boolean))
      } else {
        setSessions(Array.isArray(data) ? data : data ? [data] : [])
      }
    } catch {
      toast.error("Unable to load stock count sessions")
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleNormalizeRow = async (countId: string, lineId: string) => {
    setNormalizing(lineId)
    try {
      const response = await fetch("/api/inventory/count/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countId, lineId }),
      })
      if (!response.ok) throw new Error()
      toast.success("Product baseline count normalized")
      loadSessions()
    } catch {
      toast.error("Unable to normalize count")
    } finally {
      setNormalizing(null)
    }
  }

  const handleNormalizeAll = async (countId: string) => {
    setNormalizingAll(true)
    try {
      const response = await fetch("/api/inventory/count/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countId, normalizeAll: true }),
      })
      if (!response.ok) throw new Error()
      toast.success("All products in session normalized successfully")
      loadSessions()
    } catch {
      toast.error("Unable to normalize session")
    } finally {
      setNormalizingAll(false)
    }
  }

  const titleText = range === "all"
    ? "All saved stock counts"
    : range.includes("_to_")
    ? `Stock counts: ${range.replace("_to_", " to ")}`
    : `Stock counts: ${range}`

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/count" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Stock count
            </Link>
            <span>/</span>
            <span>History</span>
          </div>
          <h1 className="text-3xl font-bold">{titleText}</h1>
          <p className="text-sm text-muted-foreground">Review count discrepancies and execute admin inventory normalization.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" type="button" onClick={() => setDateRangeOpen(true)}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            Change date / range
          </Button>
          {isAdmin ? <span className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm"><ShieldCheck className="h-4 w-4 text-emerald-500" />Admin controls</span> : null}
          <Button variant="outline" asChild>
            <Link href="/count">Back to count</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading stock count sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No stock count sessions found for the selected range.
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session.id} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Session date: {format(new Date(session.date), "PPP")}
                  {session.shelfName ? <span className="text-xs font-normal text-muted-foreground">({session.shelfName})</span> : null}
                  {session.normalized ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Normalized
                    </span>
                  ) : null}
                </h2>
                <p className="text-xs text-muted-foreground">{session.lines?.length || 0} product lines recorded</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" asChild><Link href={`/count?edit=${session.id}`}>Edit</Link></Button>
                {isAdmin ? <Button
                  size="sm"
                  variant={session.normalized ? "outline" : "default"}
                  onClick={() => handleNormalizeAll(session.id)}
                  disabled={normalizingAll}
                >
                  {normalizingAll ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                  {session.normalized ? "Re-normalize all" : "Normalize all"}
                </Button> : null}
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto touch-pan-x touch-pan-y scrollbar-thin [webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S/N</TableHead>
                    <TableHead className="w-[240px]">Product name</TableHead>
                    <TableHead className="w-[140px]">Shelf</TableHead>
                    <TableHead className="w-[140px]">Shortest expiry</TableHead>
                    <TableHead className="w-[120px]">Expected Pcs</TableHead>
                    <TableHead className="w-[120px]">Counted Pcs</TableHead>
                    <TableHead className="w-[160px]">Difference</TableHead>
                    {isAdmin ? <TableHead className="w-[120px] text-right">Normalize</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.lines.map((line, index) => {
                    const counted = line.countedPcs !== null && line.countedPcs !== undefined ? Number(line.countedPcs) : null
                    const diff = counted !== null ? counted - line.expectedPcs : null
                    const isLower = diff !== null && diff < 0
                    const isExceeded = diff !== null && diff > 0
                    const isNormalized = line.normalizedPcs !== null && line.normalizedPcs !== undefined
                    const rowColorClass = diff === null
                      ? ""
                      : isLower
                      ? "text-danger hover:text-danger"
                      : isExceeded
                      ? "text-accent hover:text-accent"
                      : "text-foreground"

                    return (
                      <TableRow key={line.id} className={rowColorClass}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{line.productName}</TableCell>
                        <TableCell>{line.shelfName || "-"}</TableCell>
                        <TableCell>{line.expiry ? format(new Date(line.expiry), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell>{line.expectedPcs.toLocaleString()} Pcs</TableCell>
                        <TableCell className="font-semibold">{counted !== null ? `${counted.toLocaleString()} Pcs` : "-"}</TableCell>
                        <TableCell className="text-xs font-semibold">
                          {diff === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span className={isLower ? "text-danger font-bold" : isExceeded ? "text-accent font-bold" : "text-foreground font-medium"}>
                              {formatDiffToUnits(diff, line.packsPerCarton, line.piecesPerPack)}
                            </span>
                          )}
                        </TableCell>

                        {isAdmin ? (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={isNormalized ? "ghost" : "outline"}
                              className="h-7 px-2 text-xs"
                              onClick={() => handleNormalizeRow(session.id, line.id)}
                              disabled={normalizing === line.id}
                            >
                              {normalizing === line.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isNormalized ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Done
                                </span>
                              ) : (
                                "Normalize"
                              )}
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      {/* Date / Range Selector Modal */}
      <Dialog open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>View saved stock counts</DialogTitle>
            <DialogDescription>Select a date or date range to view count sessions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div>
              <Label htmlFor="range-single-date">Single date</Label>
              <input
                id="range-single-date"
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
              <Label htmlFor="range-from-date">Range from</Label>
              <input
                id="range-from-date"
                type="date"
                className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm"
                value={viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => setViewRange((prev) => ({ ...prev, from: e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined }))}
              />
            </div>
            <div>
              <Label htmlFor="range-to-date">Range to</Label>
              <input
                id="range-to-date"
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
