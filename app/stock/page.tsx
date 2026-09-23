"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
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
      { key: "pcsCount", label: "Pcs/Pack" },
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
  { key: "pcsQty", label: "Pcs Qty", type: "number", className: "min-w-[100px] w-28" },
  { key: "totalPcs", label: "Total Pcs", type: "number", readOnly: true, className: "min-w-[100px] w-28" },
  { key: "costPrice", label: "Purchase Cost", type: "number", className: "min-w-[100px] w-32" },
  { key: "wholesale", label: "Wholesale", type: "boolean", className: "w-24" },
  { key: "cartonSalesPrice", label: "Carton Sales Price", type: "number", previousValueKey: "_lastSavedCartonSalesPrice", autoValueKey: "_markupCartonSalesPrice", className: "min-w-[100px] w-36" },
  { key: "packSalesPrice", label: "Pack Sales Price", type: "number", previousValueKey: "_lastSavedPackSalesPrice", autoValueKey: "_markupPackSalesPrice", className: "min-w-[100px] w-36" },
  { key: "pcsSalesPrice", label: "Pcs Sales Price", type: "number", previousValueKey: "_lastSavedPcsSalesPrice", autoValueKey: "_markupPcsSalesPrice", className: "min-w-[100px] w-36" },
  { key: "expiry", label: "Expiry", type: "date", className: "min-w-[150px] w-40" },
]

type InventoryProductName = string
type SavedStockPricing = {
  costPrice?: number
  cartonSalesPrice?: number
  packSalesPrice?: number
  pcsSalesPrice?: number
  wholesaleCartonSalesPrice?: number
  wholesalePackSalesPrice?: number
  wholesalePcsSalesPrice?: number
}

const createBlankStockRow = () => ({
  sn: "",
  productName: "",
  carton: false,
  cartonQty: "",
  packsPerCarton: "",
  pack: false,
  packQty: "",
  pcsCount: "",
  pcsQty: "",
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
  expiry: "",
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
  const [cachedProducts, setCachedProducts] = useState<InventoryProductName[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [focusRowIndex, setFocusRowIndex] = useState<number | undefined>(undefined)
  const [companies, setCompanies] = useState<Array<{ companyName: string; repName: string }>>([])
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [savedStockPricing, setSavedStockPricing] = useState<Record<string, SavedStockPricing>>({})

  const productNames = useMemo(
    () => cachedProducts,
    [cachedProducts]
  )

  useEffect(() => {
    loadInventoryProducts()
    fetch("/api/inventory/stock")
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) return
        setSavedStockPricing(data.reduce((acc, item) => {
          if (item?.productName) {
            acc[String(item.productName).trim().toLowerCase()] = {
              costPrice: item.costPrice,
              cartonSalesPrice: item.cartonSalesPrice,
              packSalesPrice: item.packSalesPrice,
              pcsSalesPrice: item.pcsSalesPrice,
              wholesaleCartonSalesPrice: item.wholesaleCartonSalesPrice,
              wholesalePackSalesPrice: item.wholesalePackSalesPrice,
              wholesalePcsSalesPrice: item.wholesalePcsSalesPrice,
            }
          }
          return acc
        }, {} as Record<string, SavedStockPricing>))
      })
      .catch(() => setSavedStockPricing({}))
    fetch("/api/inventory/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
  }, [])

  const filteredCompanies = useMemo(() => {
    const query = companyName.trim().toLowerCase()
    if (query.length < 3) return []
    return companies.filter((c) => c.companyName.toLowerCase().includes(query)).slice(0, 8)
  }, [companyName, companies])

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
          const isCarton = Boolean(stock.carton)
          const isPack = Boolean(stock.pack)
          return {
            ...stock,
            carton: isCarton,
            pack: isPack,
            wholesale: isWs,
            cartonQty: isCarton ? (stock.cartonQty ?? "") : "",
            packsPerCarton: isCarton ? (stock.packsPerCarton ?? "") : "",
            packQty: isPack ? (stock.packQty ?? "") : "",
            pcsCount: (isCarton || isPack) ? (stock.pcsCount ?? "") : "",
            pcsQty: stock.pcsQty ?? "",
            totalPcs: stock.totalPcs ?? "",
            cartonSalesPrice: isCarton ? (isWs ? (stock.wholesaleCartonSalesPrice ?? stock.cartonSalesPrice ?? "") : (stock.cartonSalesPrice ?? "")) : "",
            packSalesPrice: isPack ? (isWs ? (stock.wholesalePackSalesPrice ?? stock.packSalesPrice ?? "") : (stock.packSalesPrice ?? "")) : "",
            pcsSalesPrice: isWs ? (stock.wholesalePcsSalesPrice ?? stock.pcsSalesPrice ?? "") : (stock.pcsSalesPrice ?? ""),
            retailCartonSalesPrice: isCarton ? (stock.cartonSalesPrice ?? "") : "",
            retailPackSalesPrice: isPack ? (stock.packSalesPrice ?? "") : "",
            retailPcsSalesPrice: stock.pcsSalesPrice ?? "",
            wholesaleCartonSalesPrice: isCarton ? (stock.wholesaleCartonSalesPrice ?? "") : "",
            wholesalePackSalesPrice: isPack ? (stock.wholesalePackSalesPrice ?? "") : "",
            wholesalePcsSalesPrice: stock.wholesalePcsSalesPrice ?? "",
          }
        }))
        const productName = searchParams.get("product")
        if (productName) setFocusRowIndex(purchase.stocks.findIndex((stock: TableRow) => stock.productName === productName))
      })
      .catch(() => toast.error("Unable to load stock purchase"))
  }, [editId, searchParams])

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
      const stockInfo = typeof row.productName === "string"
        ? savedStockPricing[row.productName.trim().toLowerCase()]
        : undefined
      const wasWholesale = Boolean(previousRow?.wholesale)
      const isWholesale = Boolean(row.wholesale)
      const modeChanged = isWholesale !== wasWholesale

      const isCarton = Boolean(row.carton)
      const isPack = Boolean(row.pack)

      const cQty = isCarton && row.cartonQty !== "" && row.cartonQty !== undefined && row.cartonQty !== null ? Number(row.cartonQty) : 0
      const ppc = isCarton && row.packsPerCarton !== "" && row.packsPerCarton !== undefined && row.packsPerCarton !== null ? Number(row.packsPerCarton) : 1
      const pkQty = isPack && row.packQty !== "" && row.packQty !== undefined && row.packQty !== null
        ? Number(row.packQty)
        : (isPack && row.qty !== "" && row.qty !== undefined && row.qty !== null ? Number(row.qty) : 0)
      const pcQty = row.pcsQty !== "" && row.pcsQty !== undefined && row.pcsQty !== null ? Number(row.pcsQty) : 0
      const pCount = (isCarton || isPack) && row.pcsCount !== "" && row.pcsCount !== undefined && row.pcsCount !== null ? Number(row.pcsCount) : 1

      const cartonPieces = isCarton ? cQty * ppc * pCount : 0
      const packPieces = isPack ? pkQty * pCount : 0
      const loosePieces = pcQty

      const hasQuantity = (isCarton && cQty > 0) || (isPack && pkQty > 0) || pcQty > 0
      const calculatedTotalPcs = cartonPieces + packPieces + loosePieces
      const computedTotalPcs = hasQuantity ? calculatedTotalPcs : (row.totalPcs !== "" && row.totalPcs !== undefined ? row.totalPcs : "")

      const totalPacks = (isCarton ? cQty * ppc : 0) + (isPack ? pkQty : 0) + ((isCarton || isPack) && pCount > 0 ? pcQty / pCount : 0)
      const totalPieces = hasQuantity ? calculatedTotalPcs : (Number(row.totalPcs) || 0)

      const costValue = row.costPrice === "" || row.costPrice === undefined || row.costPrice === null ? undefined : Number(row.costPrice)
      const costPerPiece = costValue !== undefined && !Number.isNaN(costValue) && totalPieces > 0
        ? costValue / totalPieces
        : undefined
      const costPerPack = isPack && costPerPiece !== undefined
        ? costPerPiece * pCount
        : (isPack && costValue !== undefined && totalPacks > 0 ? costValue / totalPacks : undefined)
      const costPerCarton = isCarton && costPerPack !== undefined && ppc > 0
        ? costPerPack * ppc
        : undefined

      const suggestedRetailCarton = isCarton && costPerCarton !== undefined ? Number((costPerCarton * 1.3).toFixed(2)) : ""
      const suggestedRetailPack = isPack && costPerPack !== undefined ? Number((costPerPack * 1.3).toFixed(2)) : ""
      const suggestedRetailPcs = costPerPiece !== undefined ? Number((costPerPiece * 1.3).toFixed(2)) : ""

      const suggestedWholesaleCarton = isCarton && costPerCarton !== undefined ? Number((costPerCarton * 1.1).toFixed(2)) : ""
      const suggestedWholesalePack = isPack && costPerPack !== undefined ? Number((costPerPack * 1.1).toFixed(2)) : ""
      const suggestedWholesalePcs = costPerPiece !== undefined ? Number((costPerPiece * 1.1).toFixed(2)) : ""

      const quantityOrCostChanged = ["costPrice", "carton", "cartonQty", "packsPerCarton", "pack", "packQty", "pcsCount", "pcsQty"].some(
        (key) => row[key] !== previousRow?.[key]
      )

      let retailCarton = isCarton ? (row.retailCartonSalesPrice ?? previousRow?.retailCartonSalesPrice ?? "") : ""
      let retailPack = isPack ? (row.retailPackSalesPrice ?? previousRow?.retailPackSalesPrice ?? "") : ""
      let retailPcs = row.retailPcsSalesPrice ?? previousRow?.retailPcsSalesPrice ?? ""

      let wholesaleCarton = isCarton ? (row.wholesaleCartonSalesPrice ?? previousRow?.wholesaleCartonSalesPrice ?? "") : ""
      let wholesalePack = isPack ? (row.wholesalePackSalesPrice ?? previousRow?.wholesalePackSalesPrice ?? "") : ""
      let wholesalePcs = row.wholesalePcsSalesPrice ?? previousRow?.wholesalePcsSalesPrice ?? ""

      if (modeChanged) {
        if (isWholesale) {
          retailCarton = isCarton ? (row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? row.cartonSalesPrice : (retailCarton || suggestedRetailCarton)) : ""
          retailPack = isPack ? (row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? row.packSalesPrice : (retailPack || suggestedRetailPack)) : ""
          retailPcs = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? row.pcsSalesPrice : (retailPcs || suggestedRetailPcs)
          wholesaleCarton = isCarton ? (wholesaleCarton || suggestedWholesaleCarton) : ""
          wholesalePack = isPack ? (wholesalePack || suggestedWholesalePack) : ""
          wholesalePcs = wholesalePcs || suggestedWholesalePcs
        } else {
          wholesaleCarton = isCarton ? (row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined ? row.cartonSalesPrice : (wholesaleCarton || suggestedWholesaleCarton)) : ""
          wholesalePack = isPack ? (row.packSalesPrice !== "" && row.packSalesPrice !== undefined ? row.packSalesPrice : (wholesalePack || suggestedWholesalePack)) : ""
          wholesalePcs = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined ? row.pcsSalesPrice : (wholesalePcs || suggestedWholesalePcs)
          retailCarton = isCarton ? (retailCarton || suggestedRetailCarton) : ""
          retailPack = isPack ? (retailPack || suggestedRetailPack) : ""
          retailPcs = retailPcs || suggestedRetailPcs
        }
      } else {
        if (isWholesale) {
          if (isCarton && row.cartonSalesPrice !== previousRow?.cartonSalesPrice) wholesaleCarton = row.cartonSalesPrice
          if (isPack && row.packSalesPrice !== previousRow?.packSalesPrice) wholesalePack = row.packSalesPrice
          if (row.pcsSalesPrice !== previousRow?.pcsSalesPrice) wholesalePcs = row.pcsSalesPrice
        } else {
          if (isCarton && row.cartonSalesPrice !== previousRow?.cartonSalesPrice) retailCarton = row.cartonSalesPrice
          if (isPack && row.packSalesPrice !== previousRow?.packSalesPrice) retailPack = row.packSalesPrice
          if (row.pcsSalesPrice !== previousRow?.pcsSalesPrice) retailPcs = row.pcsSalesPrice
        }
      }

      if (quantityOrCostChanged) {
        if (row.costPrice !== previousRow?.costPrice) {
          retailCarton = suggestedRetailCarton
          retailPack = suggestedRetailPack
          retailPcs = suggestedRetailPcs
          wholesaleCarton = suggestedWholesaleCarton
          wholesalePack = suggestedWholesalePack
          wholesalePcs = suggestedWholesalePcs
        } else {
          if (isCarton && retailCarton === "") retailCarton = suggestedRetailCarton
          if (isPack && retailPack === "") retailPack = suggestedRetailPack
          if (retailPcs === "") retailPcs = suggestedRetailPcs
          if (isCarton && wholesaleCarton === "") wholesaleCarton = suggestedWholesaleCarton
          if (isPack && wholesalePack === "") wholesalePack = suggestedWholesalePack
          if (wholesalePcs === "") wholesalePcs = suggestedWholesalePcs
        }
      }

      const activeCarton = isCarton ? (isWholesale ? wholesaleCarton : retailCarton) : ""
      const activePack = isPack ? (isWholesale ? wholesalePack : retailPack) : ""
      const activePcs = isWholesale ? wholesalePcs : retailPcs

      return {
        ...row,
        carton: isCarton,
        pack: isPack,
        cartonQty: isCarton ? row.cartonQty : "",
        packsPerCarton: isCarton ? row.packsPerCarton : "",
        packQty: isPack ? row.packQty : "",
        pcsCount: (isCarton || isPack) ? row.pcsCount : "",
        totalPcs: computedTotalPcs,
        cartonCostPrice: isCarton && costPerCarton !== undefined ? Number(costPerCarton.toFixed(2)) : "",
        packCostPrice: isPack && costPerPack !== undefined ? Number(costPerPack.toFixed(2)) : "",
        pcsCostPrice: costPerPiece !== undefined ? Number(costPerPiece.toFixed(2)) : "",
        cartonSalesPrice: activeCarton,
        packSalesPrice: activePack,
        pcsSalesPrice: activePcs,
        retailCartonSalesPrice: isCarton ? retailCarton : "",
        retailPackSalesPrice: isPack ? retailPack : "",
        retailPcsSalesPrice: retailPcs,
        wholesaleCartonSalesPrice: isCarton ? wholesaleCarton : "",
        wholesalePackSalesPrice: isPack ? wholesalePack : "",
        wholesalePcsSalesPrice: wholesalePcs,
        _lastSavedCartonSalesPrice: isCarton ? (isWholesale ? (stockInfo?.wholesaleCartonSalesPrice ?? stockInfo?.cartonSalesPrice ?? "") : (stockInfo?.cartonSalesPrice ?? stockInfo?.wholesaleCartonSalesPrice ?? "")) : "",
        _lastSavedPackSalesPrice: isPack ? (isWholesale ? (stockInfo?.wholesalePackSalesPrice ?? stockInfo?.packSalesPrice ?? "") : (stockInfo?.packSalesPrice ?? stockInfo?.wholesalePackSalesPrice ?? "")) : "",
        _lastSavedPcsSalesPrice: isWholesale ? (stockInfo?.wholesalePcsSalesPrice ?? stockInfo?.pcsSalesPrice ?? "") : (stockInfo?.pcsSalesPrice ?? stockInfo?.wholesalePcsSalesPrice ?? ""),
        _markupCartonSalesPrice: isWholesale ? suggestedWholesaleCarton : suggestedRetailCarton,
        _markupPackSalesPrice: isWholesale ? suggestedWholesalePack : suggestedRetailPack,
        _markupPcsSalesPrice: isWholesale ? suggestedWholesalePcs : suggestedRetailPcs,
      }
    })

    setTableRows(normalizedRows)
  }

  const handleSubmit = async () => {
    if (saveState === "saving") return
    const validRows = tableRows.filter((row) => row.productName)
    const invalidRow = validRows.find((row) => {
      if (row.costPrice === "" || row.costPrice === undefined || Number.isNaN(Number(row.costPrice))) return true
      const hasCartonPrice = row.carton && (row.cartonSalesPrice !== "" && row.cartonSalesPrice !== undefined && row.cartonSalesPrice !== null)
      const hasPackPrice = row.pack && (row.packSalesPrice !== "" && row.packSalesPrice !== undefined && row.packSalesPrice !== null)
      const hasPcsPrice = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined && row.pcsSalesPrice !== null
      return !hasCartonPrice && !hasPackPrice && !hasPcsPrice
    })

    if (invalidRow) {
      setSaveState("error")
      toast.error("Each stock row requires cost price plus sales price for your selected units.")
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
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild><Link href="/stock/products">Stock products</Link></Button>
          <Button variant="outline" asChild><Link href="/stock/count">Stock count</Link></Button>
          <Dialog open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DialogTrigger asChild>
            <Button className="max-w-52 font-semibold">View stocks</Button>
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
      </div>

      <div className="rounded-lg border bg-card p-2 sm:p-4 max-w-full">
        <div className="mb-4 grid gap-3 grid-cols-1 md:grid-cols-2 max-w-lg mx-auto">
          <div className="relative">
            <Label htmlFor="company-name">Company name</Label>
            <input
              id="company-name"
              className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-sm"
              value={companyName}
              onFocus={() => {
                if (companyName.trim().length >= 3) setCompanyDropdownOpen(true)
              }}
              onChange={(event) => {
                setSaveState("idle")
                const val = event.target.value
                setCompanyName(val)
                setCompanyDropdownOpen(val.trim().length >= 3)
                const match = companies.find((c) => c.companyName.toLowerCase() === val.trim().toLowerCase())
                if (match?.repName && !repName) {
                  setRepName(match.repName)
                }
              }}
              onBlur={() => {
                window.setTimeout(() => setCompanyDropdownOpen(false), 150)
              }}
              placeholder="Supplier company"
            />
            {companyDropdownOpen && filteredCompanies.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {filteredCompanies.map((c) => (
                  <button
                    key={c.companyName}
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      setCompanyName(c.companyName)
                      if (c.repName) {
                        setRepName(c.repName)
                      }
                      setCompanyDropdownOpen(false)
                    }}
                  >
                    <span className="font-medium">{c.companyName}</span>
                    {c.repName ? <span className="text-xs text-muted-foreground">Rep: {c.repName}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
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
          focusRowIndex={focusRowIndex}
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
