"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarDays, Clock3, Plus, Save, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type ExpenseRow = { name: string; amount: string; span: boolean; spanFrom: string; spanTo: string }
type SavedExpense = { id: string; date: string; total: number; items: Array<{ name: string; amount: number; span: boolean; spanFrom?: string; spanTo?: string }> }

const today = () => new Date().toISOString().slice(0, 10)
const blankRow = (): ExpenseRow => ({ name: "", amount: "", span: false, spanFrom: today(), spanTo: today() })

export default function ExpensesPage() {
  const [date, setDate] = useState(today)
  const [rows, setRows] = useState<ExpenseRow[]>(() => [blankRow(), blankRow(), blankRow()])
  const [saved, setSaved] = useState<SavedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [spanIndex, setSpanIndex] = useState<number | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewDate, setViewDate] = useState(today)
  const [viewFrom, setViewFrom] = useState("")
  const [viewTo, setViewTo] = useState("")
  const router = useRouter()

  const total = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [rows])

  const loadExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (!response.ok) throw new Error()
      setSaved(await response.json())
    } catch {
      toast.error("Unable to load expenses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadExpenses() }, [])

  const updateRow = (index: number, patch: Partial<ExpenseRow>) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  const save = async () => {
    const validRows = rows.filter((row) => row.name.trim() && row.amount !== "")
    if (!validRows.length) return toast.error("Add an expense name and amount first.")
    if (validRows.some((row) => row.span && (!row.spanFrom || !row.spanTo))) return toast.error("Complete each expense span date range.")
    setSaving(true)
    try {
      const response = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, rows: validRows }) })
      if (!response.ok) throw new Error()
      toast.success("Expenses saved")
      setRows([blankRow(), blankRow(), blankRow()])
      await loadExpenses()
    } catch {
      toast.error("Unable to save expenses")
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-screen space-y-6 bg-muted/20 p-6">
    <header className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Operations / expenses</p><h1 className="mt-2 text-3xl font-bold">Expense ledger</h1><p className="mt-1 text-sm text-muted-foreground">Capture one-off costs and expenses shared over a time frame.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><Label htmlFor="expense-date" className="sr-only">Expense date</Label><Input id="expense-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-[160px]" /></div><Button type="button" variant="outline" onClick={() => setViewOpen(true)}>View expenses</Button></div>
    </header>

    <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">New expense</h2><p className="text-sm text-muted-foreground">Use Span for costs distributed between two dates.</p></div><div className="text-right"><p className="text-xs uppercase tracking-wide text-muted-foreground">Draft total</p><p className="text-xl font-bold">₦{total.toLocaleString()}</p></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Expense name</th><th className="w-[180px] p-3">Amount</th><th className="w-[120px] p-3">Span</th><th className="w-[120px] p-3">Dates</th><th className="w-12 p-3"></th></tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0"><td className="p-3"><Input placeholder="e.g. Transport" value={row.name} onChange={(event) => updateRow(index, { name: event.target.value })} /></td><td className="p-3"><Input type="number" min="0" step="0.01" placeholder="0.00" value={row.amount} onChange={(event) => updateRow(index, { amount: event.target.value })} /></td><td className="p-3"><label className="flex items-center gap-2"><input type="checkbox" checked={row.span} onChange={(event) => { updateRow(index, { span: event.target.checked }); if (event.target.checked) setSpanIndex(index) }} /> Shared</label></td><td className="p-3">{row.span ? <Button type="button" variant="outline" size="sm" onClick={() => setSpanIndex(index)}><Clock3 className="mr-2 h-4 w-4" />Set dates</Button> : <span className="text-muted-foreground">One day</span>}</td><td className="p-3"><Button type="button" variant="ghost" size="icon" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} aria-label="Remove expense row">×</Button></td></tr>)}</tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="outline" onClick={() => setRows((current) => [...current, blankRow()])}><Plus className="mr-2 h-4 w-4" />Add row</Button><Button type="button" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save expenses"}</Button></div>
    </section>

    <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary" /><div><h2 className="text-lg font-semibold">Saved expenses</h2><p className="text-sm text-muted-foreground">{saved.length} saved record{saved.length === 1 ? "" : "s"}</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Date</th><th className="p-3">Expenses</th><th className="p-3">Span</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="p-4">Loading expenses...</td></tr> : saved.length === 0 ? <tr><td colSpan={4} className="p-4 text-muted-foreground">No saved expenses yet.</td></tr> : saved.map((expense) => <tr key={expense.id} className="border-b last:border-0"><td className="p-3">{format(new Date(expense.date), "MMM d, yyyy")}</td><td className="p-3">{expense.items.map((item) => item.name).join(", ")}</td><td className="p-3">{expense.items.filter((item) => item.span).length || "-"}</td><td className="p-3 text-right font-semibold">₦{Number(expense.total).toLocaleString()}</td></tr>)}</tbody></table></div></section>

    <Dialog open={spanIndex !== null} onOpenChange={(open) => !open && setSpanIndex(null)}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Expense time frame</DialogTitle><DialogDescription>Choose the start and ending dates over which this expense is shared.</DialogDescription></DialogHeader>{spanIndex !== null ? <div className="grid gap-4 py-3"><div><Label htmlFor="span-from">Starting date</Label><Input id="span-from" type="date" value={rows[spanIndex]?.spanFrom ?? today()} onChange={(event) => updateRow(spanIndex, { spanFrom: event.target.value })} /></div><div><Label htmlFor="span-to">Ending date</Label><Input id="span-to" type="date" value={rows[spanIndex]?.spanTo ?? today()} onChange={(event) => updateRow(spanIndex, { spanTo: event.target.value })} /></div></div> : null}<DialogFooter><Button type="button" onClick={() => setSpanIndex(null)}>Done</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={viewOpen} onOpenChange={setViewOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>View saved expenses</DialogTitle><DialogDescription>Choose a date, date range, or all saved expenses.</DialogDescription></DialogHeader><div className="grid gap-4 py-3"><div><Label htmlFor="view-expense-date">Single date</Label><Input id="view-expense-date" type="date" value={viewDate} onChange={(event) => { setViewDate(event.target.value); setViewFrom(""); setViewTo("") }} /></div><div><Label htmlFor="view-expense-from">Range from</Label><Input id="view-expense-from" type="date" value={viewFrom} onChange={(event) => setViewFrom(event.target.value)} /></div><div><Label htmlFor="view-expense-to">Range to</Label><Input id="view-expense-to" type="date" value={viewTo} onChange={(event) => setViewTo(event.target.value)} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => { router.push("/expenses/all"); setViewOpen(false) }}>All</Button><Button type="button" onClick={() => { router.push(viewFrom && viewTo ? `/expenses/${viewFrom}_to_${viewTo}` : `/expenses/${viewDate}`); setViewOpen(false) }}>View</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
