"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tables, AutocompleteOption, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"

const salesColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", required: true, className: "w-10" },
  { key: "newCustomer", label: "NC", type: "boolean", className: "w-20" },
  { key: "productName", label: "Product Name", type: "text", required: true },
  {
    key: "carton",
    label: "Carton",
    type: "boolean",
    className: "w-28",
    conditionalFields: [
      { key: "cartonQty", label: "Carton Qty" },
    ],
  },
  {
    key: "pack",
    label: "Pack",
    type: "boolean",
    className: "w-28",
    conditionalFields: [
      { key: "packQty", label: "Pack Qty" },
    ],
  },
  { key: "pcsQty", label: "Pcs Qty", type: "number", className: "min-w-[100px] w-28" },
  { key: "totalPcs", label: "Total Pcs", type: "number", readOnly: true, className: "min-w-[100px] w-28" },
  { key: "wholesale", label: "Wholesale", type: "boolean", className: "w-24" },
  { key: "salesPrice", label: "Sales Price", type: "number", previousValueKey: "_lastSavedSalesPrice", autoValueKey: "_markupSalesPrice", className: "min-w-[100px] w-36" },
  { key: "total", label: "Total Price", type: "number", className: "min-w-[100px] w-36" },
]

type InventoryProductName = string
type PaymentMethod = "" | "cash" | "pos" | "cash&pos"
type GroupPayment = {
  paymentMethod: PaymentMethod
  cashPaid: string
  posPayment: string
  change: string
}
type SalesCustomerSection = {
  id: string
  customerName: string
  rows: TableRow[]
  globalWholesale: boolean
  paymentMethod: PaymentMethod
  cashPaid: string
  posPayment: string
  change: string
  groupPayments: GroupPayment[]
}

const createBlankSalesRow = () => ({
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
  wholesale: false,
  newCustomer: false,
  salesPrice: "",
  total: "",
})

const createCustomerSection = (): SalesCustomerSection => ({
  id: `${Date.now()}-${Math.random()}`,
  customerName: "",
  rows: Array.from({ length: 4 }, createBlankSalesRow),
  globalWholesale: false,
  paymentMethod: "",
  cashPaid: "",
  posPayment: "",
  change: "",
  groupPayments: [{ paymentMethod: "", cashPaid: "", posPayment: "", change: "" }],
})

const SalesPage = () => {
  const [customerSections, setCustomerSections] = useState<SalesCustomerSection[]>(() => [createCustomerSection()])
  const [paymentDialogSectionId, setPaymentDialogSectionId] = useState<string | null>(null)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [viewRange, setViewRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateMode, setDateMode] = useState<"single" | "range">("single")
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [cachedProducts, setCachedProducts] = useState<InventoryProductName[]>([])
  const [stockPricing, setStockPricing] = useState<Record<string, { costPrice?: number; cartonSalesPrice?: number; packSalesPrice?: number; pcsSalesPrice?: number; wholesaleCartonSalesPrice?: number; wholesalePackSalesPrice?: number; wholesalePcsSalesPrice?: number }>>({})
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [focusRowIndex, setFocusRowIndex] = useState<number | undefined>(undefined)
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const productNames = useMemo(() => cachedProducts, [cachedProducts])
  const productOptions = useMemo<AutocompleteOption[]>(() => productNames.map((productName) => {
    const pricing = stockPricing[productName.trim().toLowerCase()]
    const price = pricing?.pcsSalesPrice ?? pricing?.packSalesPrice ?? pricing?.cartonSalesPrice
    return { value: productName, label: `(${price == null ? "-" : `₦${Number(price).toLocaleString()}`}) ${productName}` }
  }), [productNames, stockPricing])

  useEffect(() => {
    loadInventoryProducts()
    loadStockPricing()
  }, [])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/inventory/sales/${editId}`)
      .then((response) => response.json())
      .then((sale) => {
        if (!sale?.sales) return
        const firstCustomer = sale.sales[0]?.customerName ?? ""
        if (sale.date) {
          setSelectedDate(new Date(sale.date))
          setViewDate(new Date(sale.date))
          setDateMode("single")
          setSelectedRange({ from: undefined, to: undefined })
        } else if (sale.rangeFrom && sale.rangeTo) {
          setSelectedRange({ from: new Date(sale.rangeFrom), to: new Date(sale.rangeTo) })
          setDateMode("range")
        }
        const rows = sale.sales.map((row: TableRow) => ({
          ...row,
          carton: Boolean(row.carton),
          cartonQty: row.cartonQty ?? "",
          packsPerCarton: row.packsPerCarton ?? "",
          pack: Boolean(row.pack),
          packQty: row.packQty ?? "",
          pcsCount: row.pcsCount ?? "",
          pcsQty: row.pcsQty ?? "",
          totalPcs: row.totalPcs ?? "",
          salesPrice: row.price ?? row.packSalesPrice ?? row.pcsSalesPrice ?? "",
          total: row.total ?? "",
        }))
        setCustomerSections([{
          id: `${Date.now()}-edit`,
          customerName: firstCustomer,
          rows,
          globalWholesale: Boolean(sale.sales.some((row: TableRow) => row.wholesale)),
          paymentMethod: sale.paymentMethod ?? "",
          cashPaid: sale.cashPaid == null ? "" : String(sale.cashPaid),
          posPayment: sale.posPayment == null ? "" : String(sale.posPayment),
          change: sale.change == null ? "" : String(sale.change),
          groupPayments: [{
            paymentMethod: sale.paymentMethod ?? "",
            cashPaid: sale.cashPaid == null ? "" : String(sale.cashPaid),
            posPayment: sale.posPayment == null ? "" : String(sale.posPayment),
            change: sale.change == null ? "" : String(sale.change),
          }],
        }])
        const productName = searchParams.get("product")
        if (productName) setFocusRowIndex(sale.sales.findIndex((row: TableRow) => row.productName === productName))
      })
      .catch(() => toast.error("Unable to load saved sales"))
  }, [editId, searchParams])

  const loadInventoryProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch("/api/inventory/products")
      const data = await response.json()
      setCachedProducts(Array.isArray(data) ? data.filter((item): item is string => typeof item === "string") : [])
    } catch (error) {
      console.error(error)
      toast.error("Unable to load inventory products")
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadStockPricing = async () => {
    try {
      const response = await fetch("/api/inventory/stock")
      const data = await response.json()
      if (Array.isArray(data)) {
        setStockPricing(
          data.reduce((acc, item: any) => {
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
          }, {} as Record<string, { costPrice?: number; cartonSalesPrice?: number; packSalesPrice?: number; pcsSalesPrice?: number; wholesaleCartonSalesPrice?: number; wholesalePackSalesPrice?: number; wholesalePcsSalesPrice?: number }>)
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  const totalCustomers = customerSections.reduce((count, section) => {
    const rows = section.rows.filter((row) => row.productName)
    return count + (rows.length ? 1 + rows.filter((row) => Boolean(row.newCustomer)).length : 0)
  }, 0)

  const updateSection = (sectionId: string, update: Partial<SalesCustomerSection>) => {
    setCustomerSections((current) => current.map((section) => section.id === sectionId ? { ...section, ...update } : section))
  }

  const sectionTotal = (section: SalesCustomerSection) => section.rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)

  const paymentForGroup = (section: SalesCustomerSection, groupIndex: number): GroupPayment => section.groupPayments[groupIndex] ?? { paymentMethod: "", cashPaid: "", posPayment: "", change: "" }

  const groupIndexForStart = (section: SalesCustomerSection, startIndex: number) =>
    section.rows.slice(0, startIndex + 1).filter((row) => Boolean(row.newCustomer)).length

  const updateGroupPayment = (section: SalesCustomerSection, groupIndex: number, update: Partial<GroupPayment>) => {
    const payments = [...section.groupPayments]
    while (payments.length <= groupIndex) payments.push({ paymentMethod: "", cashPaid: "", posPayment: "", change: "" })
    payments[groupIndex] = { ...payments[groupIndex], ...update }
    updateSection(section.id, { groupPayments: payments })
  }

  const setGroupPaymentMethod = (section: SalesCustomerSection, groupIndex: number, method: PaymentMethod, total: number) => {
    const current = paymentForGroup(section, groupIndex)
    updateGroupPayment(section, groupIndex, {
      paymentMethod: method,
      cashPaid: method === "cash" ? String(Number(total.toFixed(2))) : method === "cash&pos" ? current.cashPaid : "",
      posPayment: method === "pos" ? String(Number(total.toFixed(2))) : method === "cash&pos" ? current.posPayment : "",
    })
  }

  const groupPaymentControls = (section: SalesCustomerSection, startIndex: number, total: number) => {
    const groupIndex = groupIndexForStart(section, startIndex)
    const payment = paymentForGroup(section, groupIndex)
    return <div className="flex min-w-[620px] flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold">Customer total</span>
      {(["cash", "pos", "cash&pos"] as const).map((method) => <label key={method} className="flex items-center gap-1"><input type="checkbox" checked={payment.paymentMethod === method} onChange={(event) => setGroupPaymentMethod(section, groupIndex, event.target.checked ? method : "", total)} />{method === "cash&pos" ? "Cash & transfer" : method.toUpperCase()}</label>)}
      <label className="flex items-center gap-1">Cash<input type="number" min="0" step="0.01" className="w-24 rounded border bg-transparent px-2 py-1" value={payment.cashPaid} onChange={(event) => updateGroupPayment(section, groupIndex, { cashPaid: event.target.value })} /></label>
      <label className="flex items-center gap-1">POS<input type="number" min="0" step="0.01" className="w-24 rounded border bg-transparent px-2 py-1" value={payment.posPayment} onChange={(event) => updateGroupPayment(section, groupIndex, { posPayment: event.target.value })} /></label>
      <label className="flex items-center gap-1">Change<input type="number" min="0" step="0.01" className="w-24 rounded border bg-transparent px-2 py-1" value={payment.change} onChange={(event) => updateGroupPayment(section, groupIndex, { change: event.target.value })} /></label>
    </div>
  }

  const groupPaymentSummary = (section: SalesCustomerSection) => {
    const groups = section.rows.reduce((count, row) => count + (row.productName && row.newCustomer ? 1 : 0), section.rows.some((row) => row.productName) ? 1 : 0)
    return Array.from({ length: groups }, (_, index) => paymentForGroup(section, index)).reduce((summary, payment) => ({
      cash: summary.cash + Number(payment.cashPaid || 0),
      pos: summary.pos + Number(payment.posPayment || 0),
      change: summary.change + Number(payment.change || 0),
    }), { cash: 0, pos: 0, change: 0 })
  }

  const setSectionPaymentMethod = (section: SalesCustomerSection, method: PaymentMethod) => {
    const total = sectionTotal(section)
    updateSection(section.id, {
      paymentMethod: method,
      cashPaid: method === "cash" ? String(Number(total.toFixed(2))) : method === "cash&pos" ? section.cashPaid : "",
      posPayment: method === "pos" ? String(Number(total.toFixed(2))) : method === "cash&pos" ? section.posPayment : "",
      ...(method === "cash&pos" ? {} : { change: section.change }),
    })
    if (method === "cash&pos") setPaymentDialogSectionId(section.id)
  }

  const currentLabel = useMemo(() => {
    if (dateMode === "range" && selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "PPP")} - ${format(selectedRange.to, "PPP")}`
    }
    return format(selectedDate, "PPP")
  }, [dateMode, selectedDate, selectedRange])

  const handleRowChange = (section: SalesCustomerSection, rows: TableRow[], wholesaleOverride = section.globalWholesale) => {
    setSaveState((current) => current === "saving" ? current : "idle")
    const normalizedRows = rows.map((row, rowIndex) => {
      const productName = typeof row.productName === "string" ? row.productName : ""
      const stockInfo = productName ? stockPricing[productName.trim().toLowerCase()] : undefined
      const previousRow = section.rows[rowIndex]
      const productChanged = productName.trim().toLowerCase() !== String(previousRow?.productName ?? "").trim().toLowerCase()
      const rowWholesale = Boolean(row.wholesale) || wholesaleOverride
      const previousWholesale = Boolean(previousRow?.wholesale) || section.globalWholesale
      const wholesaleChanged = rowWholesale !== previousWholesale
      const costValue = row.costPrice === "" || row.costPrice === undefined || row.costPrice === null
        ? stockInfo?.costPrice
        : Number(row.costPrice)

      const cartonQty = row.cartonQty !== "" && row.cartonQty !== undefined && row.cartonQty !== null ? Number(row.cartonQty) : 0
      const packsPerCarton = row.packsPerCarton !== "" && row.packsPerCarton !== undefined && row.packsPerCarton !== null ? Number(row.packsPerCarton) : 1
      const packQty = row.packQty !== "" && row.packQty !== undefined && row.packQty !== null ? Number(row.packQty) : 0
      const pCount = row.pcsCount !== "" && row.pcsCount !== undefined && row.pcsCount !== null ? Number(row.pcsCount) : 1
      const pcQty = row.pcsQty !== "" && row.pcsQty !== undefined && row.pcsQty !== null ? Number(row.pcsQty) : 0
      const computedTotalPcs = cartonQty > 0 || packQty > 0 || pcQty > 0 ? (cartonQty * packsPerCarton * pCount) + (packQty * pCount) + pcQty : ""
      const quantityChanged = cartonQty !== Number(previousRow?.cartonQty || 0) || packQty !== Number(previousRow?.packQty || 0) || pcQty !== Number(previousRow?.pcsQty || 0) || packsPerCarton !== Number(previousRow?.packsPerCarton || 1) || pCount !== Number(previousRow?.pcsCount || 1)

      // Last-saved prices from stock (respects wholesale flag, unit-type aware)
      const lastSavedCarton = rowWholesale
        ? (stockInfo?.wholesaleCartonSalesPrice ?? stockInfo?.cartonSalesPrice)
        : (stockInfo?.cartonSalesPrice ?? stockInfo?.wholesaleCartonSalesPrice)
      const lastSavedPack = rowWholesale
        ? (stockInfo?.wholesalePackSalesPrice ?? stockInfo?.packSalesPrice)
        : (stockInfo?.packSalesPrice ?? stockInfo?.wholesalePackSalesPrice)
      const lastSavedPcs = rowWholesale
        ? (stockInfo?.wholesalePcsSalesPrice ?? stockInfo?.pcsSalesPrice)
        : (stockInfo?.pcsSalesPrice ?? stockInfo?.wholesalePcsSalesPrice)

      // Markup-calculated prices per unit type (derived from cost / totalPcs)
      const markupFactor = rowWholesale ? 1.1 : 1.3
      const totalPiecesNum = Number(computedTotalPcs) || 0
      const costPerPiece = costValue !== undefined && !Number.isNaN(costValue) && totalPiecesNum > 0
        ? costValue / totalPiecesNum
        : undefined
      const markupPcs = costPerPiece !== undefined ? Number((costPerPiece * markupFactor).toFixed(2)) : undefined
      const markupPack = costPerPiece !== undefined && pCount > 0 ? Number((costPerPiece * pCount * markupFactor).toFixed(2)) : undefined
      const markupCarton = costPerPiece !== undefined && packsPerCarton > 0 && pCount > 0
        ? Number((costPerPiece * packsPerCarton * pCount * markupFactor).toFixed(2))
        : undefined

      // Active unit type: pick the last saved price first, fall back to markup, then keep existing
      const defaultCarton = lastSavedCarton !== undefined ? lastSavedCarton : (markupCarton ?? undefined)
      const defaultPack = lastSavedPack !== undefined ? lastSavedPack : (markupPack ?? undefined)
      const defaultPcs = lastSavedPcs !== undefined ? lastSavedPcs : (markupPcs ?? undefined)
      const isCartonMode = cartonQty > 0 || Boolean(row.carton)
      const isPackMode = packQty > 0 || Boolean(row.pack)
      const defaultPrice = isCartonMode ? defaultCarton : isPackMode ? defaultPack : defaultPcs

      // The markup price for the active unit (for checkbox comparison)
      const activeMarkupPrice = isCartonMode ? markupCarton : isPackMode ? markupPack : markupPcs
      // The last-saved price for the active unit (for checkbox)
      const activeLastSavedPrice = isCartonMode ? lastSavedCarton : isPackMode ? lastSavedPack : lastSavedPcs

      const nextSalesPrice = productChanged
        ? defaultPrice ?? row.salesPrice
        : wholesaleChanged && !row._salesPriceManual
        ? (defaultPrice ?? row.salesPrice)
        : row._salesPriceManual
        ? row.salesPrice
        : row.salesPrice === "" || row.salesPrice === undefined || row.salesPrice === null
        ? (defaultPrice ?? row.salesPrice)
        : row.salesPrice
      const priceMultiplier = isCartonMode
        ? cartonQty + packQty / packsPerCarton + pcQty / (packsPerCarton * pCount)
        : isPackMode
        ? cartonQty * packsPerCarton + packQty + pcQty / pCount
        : Number(computedTotalPcs) || 0
      const totalManual = Boolean(row._totalManual) && !productChanged && !quantityChanged && !wholesaleChanged
      const preciseSalesPrice = totalManual && priceMultiplier > 0 ? Number((Number(row.total) / priceMultiplier).toFixed(2)) : nextSalesPrice
      const normalizedSalesPrice = preciseSalesPrice === "" || preciseSalesPrice === undefined || preciseSalesPrice === null
        ? preciseSalesPrice
        : Number(Number(preciseSalesPrice).toFixed(2))
      const rowPrice = Number(normalizedSalesPrice || 0)
      const calculatedTotal = isCartonMode
        ? Number((cartonQty * rowPrice + (packQty * rowPrice) / packsPerCarton + (pcQty * rowPrice) / (packsPerCarton * pCount)).toFixed(2))
        : isPackMode
        ? Number((cartonQty * packsPerCarton * rowPrice + packQty * rowPrice + (pcQty * rowPrice) / pCount).toFixed(2))
        : Number(((computedTotalPcs === "" ? 0 : Number(computedTotalPcs)) * rowPrice).toFixed(2))
      const totalValue = totalManual ? Number(Number(row.total).toFixed(2)) : calculatedTotal

      return {
        ...row,
        wholesale: rowWholesale,
        totalPcs: computedTotalPcs,
        costPrice: costValue ?? row.costPrice,
        salesPrice: normalizedSalesPrice,
        total: totalValue || "",
        _totalManual: totalManual,
        _lastSavedSalesPrice: activeLastSavedPrice !== undefined && activeLastSavedPrice !== null ? String(activeLastSavedPrice) : "",
        _markupSalesPrice: activeMarkupPrice !== undefined && activeMarkupPrice !== null ? String(activeMarkupPrice) : "",
      }
    })

    updateSection(section.id, { rows: normalizedRows, globalWholesale: wholesaleOverride })
  }

  const handleSubmit = async () => {
    if (saveState === "saving") return
    const sectionsWithRows = customerSections.map((section) => ({ ...section, validRows: section.rows.filter((row) => row.productName) }))
    const validSections = sectionsWithRows.filter((section) => section.validRows.length > 0)
    const groupedSections = validSections.flatMap((section) => {
      const groups: TableRow[][] = []
      section.validRows.forEach((row) => {
        if (row.newCustomer && groups.length > 0) groups.push([])
        if (!groups.length) groups.push([])
        groups[groups.length - 1].push(row)
      })
      return groups.filter((rows) => rows.length > 0).map((rows, groupIndex) => ({
        ...section,
        validRows: rows,
        customerName: groupIndex === 0 ? section.customerName : "",
        groupIndex,
      }))
    })
    const invalidSection = groupedSections.find((section) => section.validRows.some(
      (row) =>
        row.costPrice === "" ||
        row.costPrice === undefined ||
        Number.isNaN(Number(row.costPrice)) ||
        row.salesPrice === "" || row.salesPrice === undefined || row.salesPrice === null
    ))

    if (!validSections.length) {
      toast.error("Add at least one product before saving sales.")
      return
    }

    if (invalidSection) {
      toast.error("Each sales row requires cost price and a sales price.")
      return
    }

    const payload = {
      date: selectedRange.from && selectedRange.to ? { from: selectedRange.from, to: selectedRange.to } : { date: selectedDate },
      sections: groupedSections.map((section) => ({
        customerName: section.customerName.trim() || undefined,
        paymentMethod: paymentForGroup(section, section.groupIndex).paymentMethod || undefined,
        cashPaid: paymentForGroup(section, section.groupIndex).cashPaid === "" ? undefined : Number(paymentForGroup(section, section.groupIndex).cashPaid),
        posPayment: paymentForGroup(section, section.groupIndex).posPayment === "" ? undefined : Number(paymentForGroup(section, section.groupIndex).posPayment),
        change: paymentForGroup(section, section.groupIndex).change === "" ? undefined : Number(paymentForGroup(section, section.groupIndex).change),
        rows: section.validRows.map((row) => ({ ...row, customerName: section.customerName.trim(), wholesale: Boolean(row.wholesale) || section.globalWholesale })),
      })),
    }

    setSaveState("saving")
    try {
      const result = await fetch(editId ? `/api/inventory/sales/${editId}` : "/api/inventory/sales", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!result.ok) {
        throw new Error("Failed to save sales")
      }
      toast.success(editId ? "Sales updated" : "Sales saved")
      setSaveState("saved")
      setCustomerSections([createCustomerSection()])
      setPaymentDialogSectionId(null)
      window.setTimeout(() => {
        if (editId) {
          router.push("/sales")
        } else {
          setSaveState("idle")
        }
      }, 3000)
    } catch (error) {
      console.error(error)
      setSaveState("error")
      toast.error("Unable to save sales")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-sm text-muted-foreground">Track daily and range-based sales.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/sales/daily?date=${format(selectedDate, "yyyy-MM-dd")}`)}>Today's sales</Button>
        <Dialog open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">View sales</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>View saved sales</DialogTitle>
              <DialogDescription>Select a date or date range to view saved sales entries.</DialogDescription>
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
                    setViewRange((prev) => ({ ...prev, from: event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined }))
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
                    setViewRange((prev) => ({ ...prev, to: event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined }))
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { router.push("/sales/all"); setDateRangeOpen(false) }}>All</Button>
              <Button onClick={() => {
                const from = viewRange.from ? format(viewRange.from, "yyyy-MM-dd") : ""
                const to = viewRange.to ? format(viewRange.to, "yyyy-MM-dd") : ""
                router.push(from && to ? `/sales/${from}_to_${to}` : `/sales/${format(viewDate, "yyyy-MM-dd")}`)
                setDateRangeOpen(false)
              }}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {customerSections.map((section, sectionIndex) => {
          const sectionTotalValue = sectionTotal(section)
          return <div key={section.id} className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              {sectionIndex === 0 ? <div className="flex flex-col gap-2 md:max-w-xs"><Label htmlFor="sales-date">Date</Label><input id="sales-date" type="date" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={format(selectedDate, "yyyy-MM-dd")} onChange={(event) => { setDateMode("single"); setSelectedDate(new Date(event.target.value)); setSelectedRange({ from: undefined, to: undefined }) }} /></div> : null}
              <label className="flex items-center gap-2 rounded border px-3 py-2 text-sm"><input type="checkbox" checked={section.globalWholesale} onChange={(event) => { const enabled = event.target.checked; handleRowChange(section, section.rows.map((row) => ({ ...row, wholesale: enabled })), enabled) }} />Wholesale</label>
            </div>
            <div className="rounded-lg border bg-card p-2 sm:p-4 max-w-full">
              <Tables columns={salesColumns} defaultRowCount={4} rows={section.rows} onRowsChange={(rows) => handleRowChange(section, rows)} autocomplete={{ productName: productOptions }} minWidth="1400px" focusRowIndex={sectionIndex === 0 ? focusRowIndex : undefined} snRestartKey="newCustomer" groupTotalKey="newCustomer" groupTotalContent={({ startIndex, total }) => groupPaymentControls(section, startIndex, total)} />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4 border-t pt-4">
              {(() => { const summary = groupPaymentSummary(section); return <><div className="mr-auto"><p className="text-xs uppercase tracking-wide text-muted-foreground">Total sales</p><p className="text-xl font-bold">₦{sectionTotalValue.toLocaleString()}</p></div><label className="flex items-center gap-2 text-sm">Cash<input readOnly type="number" className="w-28 rounded border bg-muted px-2 py-1" value={summary.cash} /></label><label className="flex items-center gap-2 text-sm">POS<input readOnly type="number" className="w-28 rounded border bg-muted px-2 py-1" value={summary.pos} /></label><label className="flex items-center gap-2 text-sm">Change<input readOnly type="number" className="w-28 rounded border bg-muted px-2 py-1" value={summary.change} /></label></> })()}
            </div>
          </div>
        })}
      </div>

      <Dialog open={paymentDialogSectionId !== null} onOpenChange={(open) => !open && setPaymentDialogSectionId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cash and POS payment</DialogTitle>
            <DialogDescription>Enter either payment amount or both amounts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cash-paid">Cash paid</Label>
              <input id="cash-paid" type="number" min="0" step="0.01" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={customerSections.find((section) => section.id === paymentDialogSectionId)?.cashPaid ?? ""} onChange={(event) => paymentDialogSectionId && updateSection(paymentDialogSectionId, { cashPaid: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-payment">POS payment</Label>
              <input id="pos-payment" type="number" min="0" step="0.01" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={customerSections.find((section) => section.id === paymentDialogSectionId)?.posPayment ?? ""} onChange={(event) => paymentDialogSectionId && updateSection(paymentDialogSectionId, { posPayment: event.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPaymentDialogSectionId(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={handleSubmit} disabled={saveState === "saving" || saveState === "saved"}>{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : editId ? "Update sales" : "Save sales"}</Button>
        <span className="text-sm text-muted-foreground">Selected: {currentLabel}</span>
        <span className="text-sm text-muted-foreground">Customers: {totalCustomers}</span>
        {loadingProducts ? <span className="text-sm">Loading products...</span> : null}
      </div>
    </div>
  )
}

export default SalesPage
