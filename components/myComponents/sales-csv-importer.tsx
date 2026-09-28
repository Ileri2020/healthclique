"use client"

import { useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type StockPricing = {
  pcsSalesPrice?: number
  packSalesPrice?: number
  cartonSalesPrice?: number
}

type CsvSaleRow = {
  id: number
  date: string
  customerSn?: number
  sourceName: string
  quantity: number
  amount: number
  unitPrice: number
  entryType: string
  productName: string
  alternatives: string[]
  query: string
  discount: boolean
}

type MatchCandidate = { name: string; price?: number; priceDifference?: number; nameScore: number }

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
const words = (value: string) => normalize(value).split(" ").filter((word) => word.length >= 3)
const priceTolerance = 0.3

function nameScore(sourceName: string, productName: string) {
  const source = normalize(sourceName)
  const product = normalize(productName)
  const sourceWords = words(sourceName)
  const productWords = words(productName)
  if (!source || !product || !sourceWords.length) return 0
  if (source === product) return 10000 + source.length

  const matched = sourceWords.map((sourceWord) => {
    const overlap = productWords
      .filter((productWord) => productWord.includes(sourceWord) || sourceWord.includes(productWord))
      .reduce((best, productWord) => Math.max(best, Math.min(sourceWord.length, productWord.length)), 0)
    return overlap >= 3 ? overlap : 0
  })
  const matchedWords = matched.filter(Boolean)
  if (!matchedWords.length) return 0
  const coverage = matchedWords.length / sourceWords.length
  const weightedLetters = matchedWords.reduce((sum, length) => sum + length * length, 0)
  const allWordsMatch = matchedWords.length === sourceWords.length
  return weightedLetters + coverage * 100 + (allWordsMatch ? 50 : 0)
}

function candidatesFor(sourceName: string, unitPrice: number, products: string[], pricing: Record<string, StockPricing>): MatchCandidate[] {
  return products
    .map((name) => {
      const score = nameScore(sourceName, name)
      const stock = pricing[name.trim().toLowerCase()]
      const price = Number(stock?.pcsSalesPrice ?? stock?.packSalesPrice ?? stock?.cartonSalesPrice)
      const hasPrice = Number.isFinite(price) && price > 0
      const priceDifference = hasPrice && Math.abs(unitPrice) > 0 ? Math.abs(Math.abs(unitPrice) - price) / price : undefined
      return { name, price: hasPrice ? price : undefined, priceDifference, nameScore: score }
    })
    .filter((candidate) => candidate.nameScore > 0)
    .sort((left, right) => {
      const leftDifference = left.priceDifference ?? Number.POSITIVE_INFINITY
      const rightDifference = right.priceDifference ?? Number.POSITIVE_INFINITY
      return leftDifference - rightDifference || right.nameScore - left.nameScore || left.name.localeCompare(right.name)
    })
}

function csvValue(record: Record<string, string>, aliases: string[]) {
  const targetKeys = new Set(aliases.map(normalize))
  const key = Object.keys(record).find((header) => targetKeys.has(normalize(header)))
  return key ? String(record[key] ?? "").trim() : ""
}

export function SalesCsvImporter({ products, pricing, loadingProducts }: { products: string[]; pricing: Record<string, StockPricing>; loadingProducts: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<CsvSaleRow[]>([])
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const unresolvedCount = rows.filter((row) => !row.discount && !row.productName).length
  const importableCount = rows.filter((row) => row.discount || row.productName).length
  const importDates = useMemo(() => [...new Set(rows.map((row) => row.date))].sort(), [rows])

  const readFile = async (file?: File) => {
    if (!file) return
    setLoading(true)
    setRows([])
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" })
      if (parsed.errors.length) throw new Error(parsed.errors[0].message)

      const imported: CsvSaleRow[] = []
      for (const [index, record] of parsed.data.entries()) {
        const date = csvValue(record, ["Date"])
        const sourceName = csvValue(record, ["Item Description", "Product Name", "Product"])
        const entryType = csvValue(record, ["Entry Type"]) || "Sale"
        const amountText = csvValue(record, ["Amount (NGN)", "Amount", "Total"])
        const quantityText = csvValue(record, ["Quantity", "Qty"])
        const customerText = csvValue(record, ["Customer / S/N", "Customer/S/N", "S/N", "Customer SN"])
        const amount = Number(amountText.replace(/[,₦\s]/g, ""))
        const quantity = Number(quantityText)
        const discount = entryType.toLowerCase() === "discount"

        // Daily total rows are summaries, not sale lines; importing them would double-count.
        if (entryType.toLowerCase().includes("recorded daily total")) continue
        if (discount) continue
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount)) continue
        if (!discount && (!sourceName || !Number.isInteger(quantity) || quantity <= 0)) continue

        const unitPrice = discount ? amount : amount / quantity
        const possible = discount ? [] : candidatesFor(sourceName, unitPrice, products, pricing)
        const withinTolerance = possible.filter((candidate) => candidate.priceDifference !== undefined && candidate.priceDifference <= priceTolerance)
        const best = withinTolerance[0]
        imported.push({
          id: index,
          date,
          customerSn: Number.isInteger(Number(customerText)) && customerText ? Number(customerText) : undefined,
          sourceName: discount ? "Discount" : sourceName,
          quantity: discount ? 0 : quantity,
          amount,
          unitPrice,
          entryType,
          productName: discount ? "Discount" : best?.name ?? "",
          alternatives: withinTolerance.slice(0, 8).map((candidate) => candidate.name),
          query: "",
          discount,
        })
      }
      setRows(imported)
      if (!imported.length) toast.error("No valid sales rows found in this CSV")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? `Unable to read CSV: ${error.message}` : "Unable to read CSV")
    } finally {
      setLoading(false)
    }
  }

  const updateRow = (id: number, update: Partial<CsvSaleRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...update } : row))
  }

  const importSales = async () => {
    if (unresolvedCount) {
      toast.error("Match every sale to an inventory product before importing")
      return
    }
    const grouped = new Map<string, { date: string; customerSn?: number; rows: Array<Record<string, unknown>> }>()
    rows.forEach((row) => {
      if (!row.discount && !row.productName) return
      const customerKey = row.customerSn == null ? "adjustment" : String(row.customerSn)
      const key = `${row.date}|${customerKey}`
      let group = grouped.get(key)
      if (!group) {
        group = { date: row.date, customerSn: row.customerSn, rows: [] }
        grouped.set(key, group)
      }
      group.rows.push({
        customerSn: row.customerSn,
        productName: row.discount ? "Discount" : row.productName,
        carton: false,
        pack: false,
        pcsQty: row.quantity,
        totalPcs: row.quantity,
        salesPrice: row.unitPrice,
        total: row.amount,
        wholesale: false,
      })
    })

    const byDate = new Map<string, Array<{ customerSn?: number; rows: Array<Record<string, unknown>> }>>()
    for (const group of grouped.values()) {
      const sections = byDate.get(group.date) ?? []
      sections.push({ customerSn: group.customerSn, rows: group.rows })
      byDate.set(group.date, sections)
    }

    setImporting(true)
    let completedDates = 0
    try {
      for (const [date, sections] of byDate) {
        const response = await fetch("/api/inventory/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: { date }, sections }),
        })
        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.error || `Import failed for ${date}`)
        }
        completedDates += 1
      }
      toast.success(`Imported ${importableCount} sale lines across ${completedDates} dates`)
      setRows([])
      setFileName("")
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(`${error instanceof Error ? error.message : "Sales import failed"}${completedDates ? ` (${completedDates} dates were already imported; do not re-import those dates)` : ""}`)
    } finally {
      setImporting(false)
    }
  }

  const matchingOptions = (row: CsvSaleRow) => {
    const query = row.query.trim()
    if (query.replace(/[^a-z]/gi, "").length < 3) return []
    return candidatesFor(query, row.unitPrice, products, pricing)
      .filter((candidate) => candidate.priceDifference !== undefined && candidate.priceDifference <= priceTolerance)
      .slice(0, 12)
  }

  return <>
    <Button variant="outline" onClick={() => setOpen(true)} disabled={loadingProducts}>Import sales CSV</Button>
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!importing) setOpen(nextOpen) }}>
      <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import sales from CSV</DialogTitle>
          <DialogDescription>Matches product names with 3+ letter substrings and uses saved piece prices as a check. Same date and customer S/N stay together. CSV pack labels are ignored; all quantities are imported as pieces.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="sales-csv-file">CSV file</Label>
            <Input id="sales-csv-file" ref={fileInput} type="file" accept=".csv,text/csv" disabled={loadingProducts || loading || importing} onChange={(event) => void readFile(event.target.files?.[0])} />
          </div>
          {fileName ? <span className="pb-2 text-sm text-muted-foreground">{fileName}</span> : null}
          {loadingProducts ? <span className="pb-2 text-sm">Loading inventory products…</span> : null}
          {loading ? <span className="pb-2 text-sm">Reading CSV…</span> : null}
        </div>
        {rows.length > 0 ? <>
          <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-md border bg-muted/30 p-3 text-sm">
            <span><strong>{rows.length}</strong> lines</span><span><strong>{importDates.length}</strong> dates</span><span><strong>{unresolvedCount}</strong> need product matching</span><span><strong>{rows.filter((row) => row.discount).length}</strong> discounts</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted"><tr><th className="p-2">Date</th><th className="p-2">Customer S/N</th><th className="p-2">CSV product</th><th className="p-2">Qty (pcs)</th><th className="p-2">Amount</th><th className="p-2">Matched inventory product</th><th className="p-2">Price check</th></tr></thead>
              <tbody>{rows.map((row) => {
                const suggested = row.alternatives.map((name) => {
                  const stock = pricing[name.trim().toLowerCase()]
                  return { name, price: Number(stock?.pcsSalesPrice ?? stock?.packSalesPrice ?? stock?.cartonSalesPrice) }
                })
                const selectedPrice = row.productName === "Discount" ? undefined : Number(pricing[row.productName.trim().toLowerCase()]?.pcsSalesPrice ?? pricing[row.productName.trim().toLowerCase()]?.packSalesPrice ?? pricing[row.productName.trim().toLowerCase()]?.cartonSalesPrice)
                const difference = selectedPrice > 0 ? Math.abs(Math.abs(row.unitPrice) - selectedPrice) / selectedPrice : undefined
                const options = row.query ? matchingOptions(row) : []
                return <tr key={row.id} className="border-t align-top">
                  <td className="whitespace-nowrap p-2">{row.date}</td>
                  <td className="p-2">{row.customerSn ?? "—"}</td>
                  <td className="min-w-44 p-2">{row.sourceName}</td>
                  <td className="p-2">{row.quantity}</td>
                  <td className="whitespace-nowrap p-2">₦{row.amount.toLocaleString()}</td>
                  <td className="min-w-64 p-2">
                    {row.discount ? <span className="font-medium">Discount adjustment</span> : <div className="relative space-y-1">
                      <div className="text-xs text-muted-foreground">Suggested: {row.productName || "No price-compatible match"}</div>
                      <Input aria-label={`Search inventory product for ${row.sourceName}`} placeholder="Type 3+ letters to search" value={row.query} onChange={(event) => updateRow(row.id, { query: event.target.value })} />
                      {options.length ? <div className="absolute left-0 right-0 top-full z-20 max-h-40 overflow-auto rounded border bg-popover p-1 shadow-md">{options.map((candidate) => <button key={candidate.name} type="button" className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-accent" onClick={() => updateRow(row.id, { productName: candidate.name, query: "" })}><span>{candidate.name}</span><span className="whitespace-nowrap text-xs text-muted-foreground">{candidate.price > 0 ? `₦${candidate.price.toLocaleString()}` : "No saved price"}</span></button>)}</div> : null}
                      {row.productName && row.productName !== row.sourceName ? <select aria-label={`Selected inventory product for ${row.sourceName}`} className="w-full rounded border bg-background px-2 py-1.5" value={row.productName} onChange={(event) => updateRow(row.id, { productName: event.target.value })}><option value={row.productName}>{row.productName}</option>{suggested.filter((item) => item.name !== row.productName).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select> : null}
                    </div>}
                  </td>
                  <td className="whitespace-nowrap p-2 text-xs">{row.discount ? "Not applicable" : difference === undefined || !Number.isFinite(difference) ? "No saved price" : `${(difference * 100).toFixed(1)}% difference ${difference <= priceTolerance ? "✓" : "⚠ over 30%"}`}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </> : <p className="py-6 text-center text-sm text-muted-foreground">Choose a CSV to preview rows before saving.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>Cancel</Button>
          <Button onClick={importSales} disabled={!rows.length || unresolvedCount > 0 || importing || loading}>{importing ? "Importing…" : `Import ${importableCount} sale lines`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
