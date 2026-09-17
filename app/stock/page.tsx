"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"
import { Check, Loader2, X } from "lucide-react"

const stockColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", required: true, className: "w-10" },
  { key: "productName", label: "Product Name", type: "text", required: true },
  {
    key: "carton",
    label: "Carton",
    type: "boolean",
    className: "w-28",
    conditionalFields: [
      { key: "cartonQty", label: "Carton Qty" },
      { key: "packsPerCarton", label: "Packs/Carton" },
    ],
  },
  {
    key: "pack",
    label: "Pack",
    type: "boolean",
    className: "w-28",
    conditionalFields: [
      { key: "packQty", label: "Pack Qty" },
      { key: "pcsCount", label: "Pcs/Pack" },
    ],
  },
  { key: "totalPcs", label: "Total Pcs", type: "number", className: "w-28" },
  { key: "costPrice", label: "Purchase Cost", type: "number", className: "w-32" },
  { key: "wholesale", label: "Wholesale", type: "boolean", className: "w-24" },
  { key: "cartonSalesPrice", label: "Carton Sales Price", type: "number", className: "w-36" },
  { key: "packSalesPrice", label: "Pack Sales Price", type: "number", className: "w-36" },
  { key: "pcsSalesPrice", label: "Pcs Sales Price", type: "number", className: "w-36" },
]

type InventoryProductName = string

const createBlankStockRow = () => ({
  sn: "",
  productName: "",
  carton: false,
  cartonQty: "",
  packsPerCarton: "",
  pack: false,
  packQty: "",
  pcsCount: "",
  totalPcs: "",
  costPrice: "",
  cartonCostPrice: "",
  packCostPrice: "",
  pcsCostPrice: "",
  wholesale: false,
  cartonSalesPrice: "",
  packSalesPrice: "",
  pcsSalesPrice: "",
  wholesaleCartonSalesPrice: "",
  wholesalePackSalesPrice: "",
  wholesalePcsSalesPrice: "",
  retailCartonSalesPrice: "",
  retailPackSalesPrice: "",
  retailPcsSalesPrice: "",
})

const StockPage = () => {
  const [tableRows, setTableRows] = useState<TableRow[]>(
    () => Array.from({ length: 4 }, createBlankStockRow)
  )
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [entryDate, setEntryDate] = useState<Date>(new Date())
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [viewRange, setViewRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const [companyName, setCompanyName] = useState("")
  const [repName, setRepName] = useState("")
  const [amountPaid, setAmountPaid] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [cachedProducts, setCachedProducts] = useState<InventoryProductName[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const productNames = useMemo(
    () => cachedProducts,
    [cachedProducts]
  )

  useEffect(() => {
    loadInventoryProducts()
  }, [])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/inventory/stock/${editId}`)
      .then((response) => response.json())
      .then((purchase) => {
        if (!purchase?.stocks) return
        setCompanyName(purchase.stocks[0]?.companyName ?? "")
        setRepName(purchase.stocks[0]?.repName ?? "")
        setAmountPaid(String(purchase.amountPaid ?? ""))
        if (purchase.date) setEntryDate(new Date(purchase.date))
        setTableRows(purchase.stocks.map((stock: TableRow) => {
          const isWs = Boolean(stock.wholesale)
          return {
            ...stock,
            wholesale: isWs,
            cartonSalesPrice: isWs ? (stock.wholesaleCartonSalesPrice ?? stock.cartonSalesPrice ?? "") : (stock.cartonSalesPrice ?? ""),
            packSalesPrice: isWs ? (stock.wholesalePackSalesPrice ?? stock.packSalesPrice ?? "") : (stock.packSalesPrice ?? ""),
            pcsSalesPrice: isWs ? (stock.wholesalePcsSalesPrice ?? stock.pcsSalesPrice ?? "") : (stock.pcsSalesPrice ?? ""),
            retailCartonSalesPrice: stock.cartonSalesPrice ?? "",
            retailPackSalesPrice: stock.packSalesPrice ?? "",
            retailPcsSalesPrice: stock.pcsSalesPrice ?? "",
            wholesaleCartonSalesPrice: stock.wholesaleCartonSalesPrice ?? "",
            wholesalePackSalesPrice: stock.wholesalePackSalesPrice ?? "",
            wholesalePcsSalesPrice: stock.wholesalePcsSalesPrice ?? "",
          }
        }))
      })
      .catch(() => toast.error("Unable to load stock purchase"))
  }, [editId])

  const loadInventoryProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch("/api/inventory/products")
      const data = await response.json()
      setCachedProducts(
        Array.isArray(data) ? data.filter((item): item is string => typeof item === "string") : []
      )
    } catch (error) {
      console.error(error)
      toast.error("Unable to load inventory products")
    } finally {
      setLoadingProducts(false)
    }
  }

  const currentLabel = useMemo(() => {
    return format(entryDate, "PPP")
  }, [entryDate])

  const handleRowChange = (rows: TableRow[]) => {
    setSaveState((current) => current === "saving" ? current : "idle")
    const normalizedRows = rows.map((row, rowIndex) => {
      const previousRow = tableRows[rowIndex]
      const wasWholesale = Boolean(previousRow?.wholesale)
      const isWholesale = Boolean(row.wholesale)
      const modeChanged = isWholesale !== wasWholesale

      const cQty = row.cartonQty !== "" && row.cartonQty !== undefined && row.cartonQty !== null ? Number(row.cartonQty) : 0
      const ppc = row.packsPerCarton !== "" && row.packsPerCarton !== undefined && row.packsPerCarton !== null ? Number(row.packsPerCarton) : 1
      const pkQty = row.packQty !== "" && row.packQty !== undefined && row.packQty !== null
        ? Number(row.packQty)
        : (row.qty !== "" && row.qty !== undefined && row.qty !== null ? Number(row.qty) : 0)
      const pCount = row.pcsCount !== "" && row.pcsCount !== undefined && row.pcsCount !== null ? Number(row.pcsCount) : 1
      const totalPacks = (cQty * ppc) + pkQty
      const totalPieces = totalPacks * pCount
      const computedTotalPcs = totalPacks > 0 ? totalPieces : ""

      const costValue = row.costPrice === "" || row.costPrice === undefined || row.costPrice === null ? undefined : Number(row.costPrice)
      const costPerPack = costValue !== undefined && !Number.isNaN(costValue) && totalPacks > 0
        ? costValue / totalPacks
        : undefined
      const costPerPiece = costValue !== undefined && !Number.isNaN(costValue) && totalPieces > 0
        ? costValue / totalPieces
        : undefined
      const costPerCarton = costPerPack !== undefined && cQty > 0
        ? costPerPack * ppc
        : undefined

      const suggestedRetailCarton = costPerCarton !== undefined ? Number((costPerCarton * 1.3).toFixed(2)) : ""
      const suggestedRetailPack = costPerPack !== undefined ? Number((costPerPack * 1.3).toFixed(2)) : ""
      const suggestedRetailPcs = costPerPiece !== undefined ? Number((costPerPiece * 1.3).toFixed(2)) : ""

      const suggestedWholesaleCarton = costPerCarton !== undefined ? Number((costPerCarton * 1.1).toFixed(2)) : ""
      const suggestedWholesalePack = costPerPack !== undefined ? Number((costPerPack * 1.1).toFixed(2)) : ""
      const suggestedWholesalePcs = costPerPiece !== undefined ? Number((costPerPiece * 1.1).toFixed(2)) : ""

      const quantityOrCostChanged = ["costPrice", "carton", "cartonQty", "packsPerCarton", "pack", "packQty", "pcsCount"].some(
        (key) => row[key] !== previousRow?.[key]
      )

      let retailCarton = row.retailCartonSalesPrice ?? previousRow?.retailCartonSalesPrice ?? ""
      let retailPack = row.retailPackSalesPrice ?? previousRow?.retailPackSalesPrice ?? ""
      let retailPcs = row.retailPcsSalesPrice ?? previousRow?.retailPcsSalesPrice ?? ""

      let wholesaleCarton = row.wholesaleCartonSalesPrice ?? previousRow?.wholesaleCartonSalesPrice ?? ""
      let wholesalePack = row.wholesalePackSalesPrice ?? previousRow?.wholesalePackSalesPrice ?? ""
      let wholesalePcs = row.wholesalePcsSalesPrice ?? previousRow?.wholesalePcsSalesPrice ?? ""

      if (modeChanged) {
        if (isWholesale) {
          retailCarton = row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? row.cartonSalesPrice : (retailCarton || suggestedRetailCarton)
          retailPack = row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? row.packSalesPrice : (retailPack || suggestedRetailPack)
          retailPcs = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? row.pcsSalesPrice : (retailPcs || suggestedRetailPcs)
        } else {
          wholesaleCarton = row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? row.cartonSalesPrice : (wholesaleCarton || suggestedWholesaleCarton)
          wholesalePack = row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? row.packSalesPrice : (wholesalePack || suggestedWholesalePack)
          wholesalePcs = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? row.pcsSalesPrice : (wholesalePcs || suggestedWholesalePcs)
        }
      } else {
        if (isWholesale) {
          if (row.cartonSalesPrice !== previousRow?.cartonSalesPrice) wholesaleCarton = row.cartonSalesPrice
          if (row.packSalesPrice !== previousRow?.packSalesPrice) wholesalePack = row.packSalesPrice
          if (row.pcsSalesPrice !== previousRow?.pcsSalesPrice) wholesalePcs = row.pcsSalesPrice
        } else {
          if (row.cartonSalesPrice !== previousRow?.cartonSalesPrice) retailCarton = row.cartonSalesPrice
          if (row.packSalesPrice !== previousRow?.packSalesPrice) retailPack = row.packSalesPrice
          if (row.pcsSalesPrice !== previousRow?.pcsSalesPrice) retailPcs = row.pcsSalesPrice
        }
      }

      if (quantityOrCostChanged) {
        if (!retailCarton || row.costPrice !== previousRow?.costPrice) retailCarton = suggestedRetailCarton
        if (!retailPack || row.costPrice !== previousRow?.costPrice) retailPack = suggestedRetailPack
        if (!retailPcs || row.costPrice !== previousRow?.costPrice) retailPcs = suggestedRetailPcs

        if (!wholesaleCarton || row.costPrice !== previousRow?.costPrice) wholesaleCarton = suggestedWholesaleCarton
        if (!wholesalePack || row.costPrice !== previousRow?.costPrice) wholesalePack = suggestedWholesalePack
        if (!wholesalePcs || row.costPrice !== previousRow?.costPrice) wholesalePcs = suggestedWholesalePcs
      } else {
        if (retailCarton === "") retailCarton = suggestedRetailCarton
        if (retailPack === "") retailPack = suggestedRetailPack
        if (retailPcs === "") retailPcs = suggestedRetailPcs

        if (wholesaleCarton === "") wholesaleCarton = suggestedWholesaleCarton
        if (wholesalePack === "") wholesalePack = suggestedWholesalePack
        if (wholesalePcs === "") wholesalePcs = suggestedWholesalePcs
      }

      const activeCarton = isWholesale ? (wholesaleCarton || suggestedWholesaleCarton) : (retailCarton || suggestedRetailCarton)
      const activePack = isWholesale ? (wholesalePack || suggestedWholesalePack) : (retailPack || suggestedRetailPack)
      const activePcs = isWholesale ? (wholesalePcs || suggestedWholesalePcs) : (retailPcs || suggestedRetailPcs)

      return {
        ...row,
        totalPcs: computedTotalPcs,
        cartonCostPrice: costPerCarton !== undefined ? Number(costPerCarton.toFixed(2)) : "",
        packCostPrice: costPerPack !== undefined ? Number(costPerPack.toFixed(2)) : "",
        pcsCostPrice: costPerPiece !== undefined ? Number(costPerPiece.toFixed(2)) : "",
        cartonSalesPrice: activeCarton,
        packSalesPrice: activePack,
        pcsSalesPrice: activePcs,
        retailCartonSalesPrice: retailCarton,
        retailPackSalesPrice: retailPack,
        retailPcsSalesPrice: retailPcs,
        wholesaleCartonSalesPrice: wholesaleCarton,
        wholesalePackSalesPrice: wholesalePack,
        wholesalePcsSalesPrice: wholesalePcs,
      }
    })

    setTableRows(normalizedRows)
  }

  const handleSubmit = async () => {
    if (saveState === "saving") return
    const validRows = tableRows.filter((row) => row.productName)
    const invalidRow = validRows.find(
      (row) =>
        row.costPrice === "" ||
        row.costPrice === undefined ||
        Number.isNaN(Number(row.costPrice)) ||
        ((row.packSalesPrice === "" || row.packSalesPrice === undefined || row.packSalesPrice === null) &&
          (row.pcsSalesPrice === "" || row.pcsSalesPrice === undefined || row.pcsSalesPrice === null))
    )

    if (invalidRow) {
      setSaveState("error")
      toast.error("Each stock row requires cost price plus either pack sales price or pcs sales price.")
      return
    }

    const payload = { date: { date: entryDate }, companyName, repName, amountPaid: Number(amountPaid) || 0, rows: validRows }

    setSaveState("saving")
    try {
      const result = await fetch(editId ? `/api/inventory/stock/${editId}` : "/api/inventory/stock", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!result.ok) {
        throw new Error("Failed to save stock")
      }
      toast.success(editId ? "Stock purchase updated" : "Stock saved successfully")
      setSaveState("saved")
      if (editId) {
        router.push("/stock")
      } else {
        setTableRows(Array.from({ length: 4 }, createBlankStockRow))
        setCompanyName("")
        setRepName("")
        setAmountPaid("")
      }
    } catch (error) {
      console.error(error)
      setSaveState("error")
      toast.error("Unable to save stock")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="text-sm text-muted-foreground">{editId ? "Edit saved stock purchase." : "Manage stock records with date or range."}</p>
        </div>
        <Dialog open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">View stocks</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>View saved stocks</DialogTitle>
              <DialogDescription>Select a date or date range to view saved stock entries.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="single-date">Single date</Label>
                <input
                  id="single-date"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={format(viewDate, "yyyy-MM-dd")}
                  onChange={(event) => {
                    setViewDate(new Date(`${event.target.value}T00:00:00`))
                    setViewRange({ from: undefined, to: undefined })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="range-from">Range from</Label>
                <input
                  id="range-from"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""}
                  onChange={(event) => {
                    setViewRange((prev) => ({
                      ...prev,
                      from: event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined,
                    }))
                  }}
                />
              </div>
              <div>
                <Label htmlFor="range-to">Range to</Label>
                <input
                  id="range-to"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={viewRange.to ? format(viewRange.to, "yyyy-MM-dd") : ""}
                  onChange={(event) => {
                    setViewRange((prev) => ({
                      ...prev,
                      to: event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined,
                    }))
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { router.push("/stock/all"); setDateRangeOpen(false) }}>All</Button>
              <Button onClick={() => {
                const from = viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""
                const to = viewRange.to ? format(viewRange.to, "yyyy-MM-dd") : ""
                router.push(from && to ? `/stock/${from}_to_${to}` : `/stock/${format(viewDate, "yyyy-MM-dd")}`)
                setDateRangeOpen(false)
              }}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card p-2 sm:p-4 overflow-x-auto max-w-full">
        <div className="mb-4 grid gap-3 grid-cols-1 md:grid-cols-2 max-w-lg mx-auto">
          <div>
            <Label htmlFor="company-name">Company name</Label>
            <input id="company-name" className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm" value={companyName} onChange={(event) => { setSaveState("idle"); setCompanyName(event.target.value) }} placeholder="Supplier company" />
          </div>
          <div>
            <Label htmlFor="rep-name">Rep name</Label>
            <input id="rep-name" className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm" value={repName} onChange={(event) => { setSaveState("idle"); setRepName(event.target.value) }} placeholder="Sales representative" />
          </div>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Label htmlFor="stock-entry-date" className="whitespace-nowrap text-sm font-medium">Stock date</Label>
          <input
            id="stock-entry-date"
            type="date"
            className="rounded border bg-transparent px-3 py-2 text-sm"
            value={format(entryDate, "yyyy-MM-dd")}
            onChange={(event) => { setSaveState("idle"); setEntryDate(new Date(`${event.target.value}T00:00:00`)) }}
          />
        </div>
        <Tables
          columns={stockColumns}
          defaultRowCount={4}
          rows={tableRows}
          onRowsChange={handleRowChange}
          autocomplete={{ productName: productNames }}
          restrictToOptions={["productName"]}
          showTotals
          minWidth="1050px"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={saveState === "saving" || saveState === "saved"}
          className={saveState === "error" ? "bg-red-600 text-white hover:bg-red-700" : saveState === "saved" ? "bg-green-600 text-white hover:bg-green-700" : ""}
        >
          {saveState === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : null}
          {saveState === "saved" ? <><Check className="mr-2 h-4 w-4" />Saved</> : null}
          {saveState === "error" ? <><X className="mr-2 h-4 w-4" />{editId ? "Retry edit" : "Retry save"}</> : null}
          {saveState === "idle" ? (editId ? "Edit stock" : "Save stock") : null}
        </Button>
        <span className="text-sm text-muted-foreground">Selected: {currentLabel}</span>
        <span className="text-sm font-medium">Total: ₦{tableRows.reduce((sum, row) => sum + (Number(row.costPrice) || 0), 0).toLocaleString()}</span>
        <Label htmlFor="amount-paid">Amount paid</Label>
        <input id="amount-paid" type="number" min="0" className="w-36 rounded border bg-transparent px-3 py-2 text-sm" value={amountPaid} onChange={(event) => { setSaveState("idle"); setAmountPaid(event.target.value) }} />
        <span className="text-sm font-medium">Balance: {Number(amountPaid) >= tableRows.reduce((sum, row) => sum + (Number(row.costPrice) || 0), 0) ? <Check className="inline h-5 w-5 text-green-600" aria-label="Paid in full" /> : `₦${Math.max(tableRows.reduce((sum, row) => sum + (Number(row.costPrice) || 0), 0) - (Number(amountPaid) || 0), 0).toLocaleString()}`}</span>
        {loadingProducts ? <span className="text-sm">Loading products...</span> : null}
      </div>
    </div>
  )
}

export default StockPage
