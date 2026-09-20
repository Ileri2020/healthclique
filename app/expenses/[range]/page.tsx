"use client"

import { use, useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Expense = {
  id: string
  date: string
  total: number
  items: Array<{ name: string; amount: number; span: boolean; spanFrom?: string; spanTo?: string }>
}

export default function ExpenseHistoryPage({ params }: { params: Promise<{ range: string }> }) {
  const token = use(params).range
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [from, to] = token === "all" ? ["", ""] : token.includes("_to_") ? token.split("_to_") : [token, token]

  useEffect(() => {
    fetch(`/api/expenses${from ? `?from=${from}&to=${to}` : ""}`)
      .then((response) => response.json())
      .then((data) => setExpenses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [from, to])

  const heading = token === "all"
    ? "All expenses"
    : from === to
    ? format(new Date(`${from}T00:00:00`), "PPP")
    : `${format(new Date(`${from}T00:00:00`), "PPP")} - ${format(new Date(`${to}T00:00:00`), "PPP")}`

  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Saved expense records</p><h1 className="text-3xl font-bold">{heading}</h1></div><Button variant="outline" asChild><Link href="/expenses">Back to expenses</Link></Button></div>
    <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="min-w-[280px]">Expenses</TableHead><TableHead>Shared spans</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4}>Loading expenses...</TableCell></TableRow> : expenses.length === 0 ? <TableRow><TableCell colSpan={4}>No expenses found.</TableCell></TableRow> : expenses.map((expense) => <TableRow key={expense.id}><TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell><TableCell>{expense.items.map((item) => `${item.name} (₦${Number(item.amount).toLocaleString()})`).join(", ")}</TableCell><TableCell>{expense.items.filter((item) => item.span).map((item) => item.spanFrom && item.spanTo ? `${format(new Date(item.spanFrom), "MMM d")} - ${format(new Date(item.spanTo), "MMM d")}` : "Shared").join(", ") || "-"}</TableCell><TableCell className="font-semibold">₦{Number(expense.total).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></div>
  </main>
}
