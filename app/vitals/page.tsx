"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Activity, CalendarDays, HeartPulse, Loader2, Printer, Save, UserRound } from "lucide-react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { openVitalsPrintWindow } from "@/lib/vitals-print"

type VitalReading = {
  id: string
  customerName: string
  recordedAt: string
  systolic: number
  diastolic: number
  pulse: number
  bloodSugar?: number | null
}

const today = () => format(new Date(), "yyyy-MM-dd")
const normalizedName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ")
const dateLabel = (value: string) => format(new Date(`${value.slice(0, 10)}T00:00:00`), "MMM d, yyyy")

export default function VitalsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const canRecordVitals = session?.user?.role === "admin" || session?.user?.role === "staff"
  const [customers, setCustomers] = useState<string[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [date, setDate] = useState(today)
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [pulse, setPulse] = useState("")
  const [bloodSugar, setBloodSugar] = useState("")
  const [readings, setReadings] = useState<VitalReading[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingReadings, setLoadingReadings] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/inventory/customers", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load customers")
        return response.json()
      })
      .then((data) => setCustomers(Array.isArray(data) ? data.filter((name): name is string => typeof name === "string") : []))
      .catch(() => toast.error("Unable to load customer names"))
      .finally(() => setLoadingCustomers(false))
  }, [])

  const loadReadings = useCallback(async (customerName: string) => {
    if (!customerName) {
      setReadings([])
      return
    }
    setLoadingReadings(true)
    try {
      const response = await fetch(`/api/vitals?customerName=${encodeURIComponent(customerName)}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "Unable to load BP history")
      setReadings(Array.isArray(data) ? data : [])
    } catch (error) {
      setReadings([])
      toast.error(error instanceof Error ? error.message : "Unable to load BP history")
    } finally {
      setLoadingReadings(false)
    }
  }, [])

  useEffect(() => {
    void loadReadings(selectedCustomer)
  }, [selectedCustomer, loadReadings])

  const customerMatches = useMemo(() => {
    const query = customerSearch.trim()
    if (query.replace(/[^a-z]/gi, "").length < 3) return []
    const normalizedQuery = normalizedName(query)
    return customers
      .filter((name) => normalizedName(name).includes(normalizedQuery))
      .slice(0, 10)
  }, [customerSearch, customers])

  const chartData = useMemo(() => readings.map((reading) => ({
    ...reading,
    day: dateLabel(reading.recordedAt),
  })), [readings])

  const latestReading = readings.at(-1)

  const printReport = () => {
    if (!selectedCustomer || !readings.length) return
    if (!openVitalsPrintWindow(selectedCustomer, readings)) toast.error("Unable to open the print view. Allow pop-ups or try again.")
  }

  const saveReading = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCustomer) {
      toast.error("Select a customer first")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: selectedCustomer, date, systolic, diastolic, pulse, bloodSugar }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Unable to save vitals")
      setReadings((current) => [...current, result as VitalReading].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()))
      setSystolic("")
      setDiastolic("")
      setPulse("")
      setBloodSugar("")
      toast.success("Vital reading saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save vitals")
    } finally {
      setSaving(false)
    }
  }

  if (sessionStatus === "loading") return <main className="p-6 text-muted-foreground">Loading access…</main>
  if (!canRecordVitals) return <main className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border bg-card p-8 text-center"><HeartPulse className="mx-auto mb-3 h-10 w-10 text-rose-500" /><h1 className="text-2xl font-bold">Vitals access restricted</h1><p className="mt-2 text-sm text-muted-foreground">Only authorized staff can record and view customer vital readings.</p></div></main>

  return <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
    <header className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-rose-500/10 via-background to-primary/10 p-6 sm:p-8">
      <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300"><Activity className="h-3.5 w-3.5" /> Health monitoring</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vitals</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Record blood pressure and pulse, then follow each customer’s readings over time.</p>
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20"><HeartPulse className="h-8 w-8" /></div>
      </div>
    </header>

    <section className="grid gap-4 md:grid-cols-3">
      <div className="relative space-y-2 md:col-span-1">
        <Label htmlFor="vitals-customer" className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" />Customer</Label>
        <Input
          id="vitals-customer"
          autoComplete="off"
          placeholder={loadingCustomers ? "Loading customers…" : "Type at least 3 letters to search"}
          value={customerSearch}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 150)}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            setSelectedCustomer("")
            setReadings([])
            setSuggestionsOpen(true)
          }}
          aria-autocomplete="list"
          aria-expanded={suggestionsOpen && customerMatches.length > 0}
        />
        {suggestionsOpen && customerSearch.trim().replace(/[^a-z]/gi, "").length >= 3 ? <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl">
          {customerMatches.length ? customerMatches.map((name) => <button key={name} type="button" role="option" aria-selected={selectedCustomer === name} className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent" onMouseDown={(event) => event.preventDefault()} onClick={() => {
            setSelectedCustomer(name)
            setCustomerSearch(name)
            setSuggestionsOpen(false)
          }}>{name}</button>) : <p className="px-3 py-2 text-sm text-muted-foreground">No matching customer found.</p>}
        </div> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="vitals-date" className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Reading date</Label>
        <Input id="vitals-date" type="date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} />
      </div>
      <div className="flex items-end text-sm text-muted-foreground">{selectedCustomer ? <>Showing readings for <strong className="ml-1 text-foreground">{selectedCustomer}</strong></> : "Choose a customer to view saved readings."}</div>
    </section>

    <form onSubmit={saveReading} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-col gap-1"><h2 className="text-xl font-semibold">New reading</h2><p className="text-sm text-muted-foreground">Enter the measurements in mmHg and beats per minute.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="group rounded-2xl border border-rose-500/20 bg-rose-500/[0.035] p-4 focus-within:ring-2 focus-within:ring-rose-500/40">
          <span className="block text-sm font-medium text-muted-foreground">Systolic pressure</span><span className="mt-1 block text-xs text-muted-foreground">Top number · mmHg</span>
          <span className="mt-3 flex items-baseline gap-2"><Input aria-label="Systolic pressure" type="number" inputMode="numeric" min="30" max="300" required value={systolic} onChange={(event) => setSystolic(event.target.value)} className="h-12 border-0 bg-transparent p-0 text-3xl font-bold shadow-none focus-visible:ring-0" placeholder="120" /><span className="text-xs text-muted-foreground">mmHg</span></span>
        </label>
        <label className="group rounded-2xl border border-blue-500/20 bg-blue-500/[0.035] p-4 focus-within:ring-2 focus-within:ring-blue-500/40">
          <span className="block text-sm font-medium text-muted-foreground">Diastolic pressure</span><span className="mt-1 block text-xs text-muted-foreground">Bottom number · mmHg</span>
          <span className="mt-3 flex items-baseline gap-2"><Input aria-label="Diastolic pressure" type="number" inputMode="numeric" min="20" max="200" required value={diastolic} onChange={(event) => setDiastolic(event.target.value)} className="h-12 border-0 bg-transparent p-0 text-3xl font-bold shadow-none focus-visible:ring-0" placeholder="80" /><span className="text-xs text-muted-foreground">mmHg</span></span>
        </label>
        <label className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.035] p-4 focus-within:ring-2 focus-within:ring-emerald-500/40">
          <span className="block text-sm font-medium text-muted-foreground">Pulse</span><span className="mt-1 block text-xs text-muted-foreground">Heart rate · beats per minute</span>
          <span className="mt-3 flex items-baseline gap-2"><Input aria-label="Pulse rate" type="number" inputMode="numeric" min="20" max="250" required value={pulse} onChange={(event) => setPulse(event.target.value)} className="h-12 border-0 bg-transparent p-0 text-3xl font-bold shadow-none focus-visible:ring-0" placeholder="72" /><span className="text-xs text-muted-foreground">bpm</span></span>
        </label>
        <label className="group rounded-2xl border border-amber-500/20 bg-amber-500/[0.035] p-4 focus-within:ring-2 focus-within:ring-amber-500/40">
          <span className="block text-sm font-medium text-muted-foreground">Blood sugar</span><span className="mt-1 block text-xs text-muted-foreground">Optional · mg/dL</span>
          <span className="mt-3 flex items-baseline gap-2"><Input aria-label="Blood sugar" type="number" inputMode="decimal" min="20" max="1000" step="0.1" value={bloodSugar} onChange={(event) => setBloodSugar(event.target.value)} className="h-12 border-0 bg-transparent p-0 text-3xl font-bold shadow-none focus-visible:ring-0" placeholder="—" /><span className="text-xs text-muted-foreground">mg/dL</span></span>
        </label>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Readings are saved to this customer’s private vitals history.</p>
        <Button type="submit" disabled={!selectedCustomer || saving} className="gap-2 rounded-xl px-5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving reading…" : "Save reading"}</Button>
      </div>
    </form>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Vitals trend</h2><p className="text-sm text-muted-foreground">Blood pressure, pulse, and blood sugar history.</p></div><div className="flex items-center gap-3">{latestReading ? <div className="rounded-xl border bg-card px-4 py-2 text-sm"><span className="text-muted-foreground">Latest </span><strong>{latestReading.systolic}/{latestReading.diastolic}</strong><span className="ml-2 text-muted-foreground">· {latestReading.pulse} bpm</span>{latestReading.bloodSugar != null ? <span className="ml-2 text-muted-foreground">· {latestReading.bloodSugar} mg/dL</span> : null}</div> : null}<Button type="button" variant="outline" className="gap-2" onClick={printReport} disabled={!selectedCustomer || !readings.length || loadingReadings}><Printer className="h-4 w-4" />Print report</Button></div></div>
      <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        {!selectedCustomer ? <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground">Select a customer to see their trend graph.</div>
          : loadingReadings ? <div className="grid h-72 place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading readings…</div>
          : chartData.length === 0 ? <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground">No saved readings for this customer yet. Add the first reading above.</div>
          : <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-2"><h3 className="px-2 text-sm font-semibold">Blood pressure <span className="font-normal text-muted-foreground">(mmHg)</span></h3><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickLine={false} axisLine={false} width={42} /><Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name) => [`${value} mmHg`, name]} /><Legend /><Line type="monotone" dataKey="systolic" name="Systolic" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></div>
            <div className="space-y-2"><h3 className="px-2 text-sm font-semibold">Pulse and blood sugar <span className="font-normal text-muted-foreground">(separate scales)</span></h3><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 38, left: -8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} /><YAxis yAxisId="pulse" tickLine={false} axisLine={false} width={42} /><YAxis yAxisId="sugar" orientation="right" tickLine={false} axisLine={false} width={50} /><Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name) => [`${value} ${name === "Pulse" ? "bpm" : "mg/dL"}`, name]} /><Legend /><Line yAxisId="pulse" type="monotone" dataKey="pulse" name="Pulse" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} /><Line yAxisId="sugar" type="monotone" dataKey="bloodSugar" name="Blood sugar" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls /></LineChart></ResponsiveContainer></div></div>
          </div>}
      </div>
    </section>

    <section className="space-y-4">
      <div><h2 className="text-2xl font-bold">Previous readings</h2><p className="text-sm text-muted-foreground">Saved blood-pressure and pulse measurements for {selectedCustomer || "the selected customer"}.</p></div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Systolic</TableHead><TableHead>Diastolic</TableHead><TableHead>Blood pressure</TableHead><TableHead>Pulse</TableHead><TableHead>Blood sugar</TableHead></TableRow></TableHeader>
          <TableBody>
            {!selectedCustomer ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Select a customer to load their readings.</TableCell></TableRow>
              : loadingReadings ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading readings…</TableCell></TableRow>
              : readings.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No readings saved yet.</TableCell></TableRow>
              : [...readings].reverse().map((reading) => <TableRow key={reading.id}><TableCell>{dateLabel(reading.recordedAt)}</TableCell><TableCell className="font-semibold text-rose-600">{reading.systolic} mmHg</TableCell><TableCell className="font-semibold text-blue-600">{reading.diastolic} mmHg</TableCell><TableCell className="font-medium">{reading.systolic}/{reading.diastolic} mmHg</TableCell><TableCell className="font-semibold text-emerald-600">{reading.pulse} bpm</TableCell><TableCell className="font-semibold text-amber-600">{reading.bloodSugar == null ? "—" : `${reading.bloodSugar} mg/dL`}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
    </section>
  </main>
}
