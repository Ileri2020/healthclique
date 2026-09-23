"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"

const salesColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", required: true, className: "w-10" },
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
  { key: "total", label: "Total Price", type: "number", readOnly: true, className: "min-w-[100px] w-36" },
]

type InventoryProductName = string
type PaymentMethod = "" | "cash" | "pos" | "cash&pos"
type SalesCustomerSection = {
  id: string
  customerName: string
  rows: TableRow[]
  globalWholesale: boolean
  paymentMethod: PaymentMethod
  cashPaid: string
  posPayment: string
  change: string
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

  const [customerList, setCustomerList] = useState<string[]>([])
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)

  const productNames = useMemo(() => cachedProducts, [cachedProducts])

  useEffect(() => {
    loadInventoryProducts()
    loadStockPricing()
    fetch("/api/inventory/customers")
      .then((res) => res.json())
      .then((data) => setCustomerList(Array.isArray(data) ? data : []))
      .catch(() => setCustomerList([]))
  }, [])

  const filteredCustomers = (name: string) => {
    const query = name.trim().toLowerCase()
    if (query.length < 3) return []
    return customerList.filter((customer) => customer.toLowerCase().includes(query)).slice(0, 8)
  }

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

  const totalCustomers = customerSections.filter((section) => section.customerName.trim()).length

  const updateSection = (sectionId: string, update: Partial<SalesCustomerSection>) => {
    setCustomerSections((current) => current.map((section) => section.id === sectionId ? { ...section, ...update } : section))
  }

  const sectionTotal = (section: SalesCustomerSection) => section.rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)

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
      const rowPrice = Number(nextSalesPrice || 0)
      const totalValue = isCartonMode
        ? Number((cartonQty * rowPrice + (packQty * rowPrice) / packsPerCarton + (pcQty * rowPrice) / (packsPerCarton * pCount)).toFixed(2))
        : isPackMode
        ? Number((cartonQty * packsPerCarton * rowPrice + packQty * rowPrice + (pcQty * rowPrice) / pCount).toFixed(2))
        : Number(((computedTotalPcs === "" ? 0 : Number(computedTotalPcs)) * rowPrice).toFixed(2))

      return {
        ...row,
        wholesale: rowWholesale,
        totalPcs: computedTotalPcs,
        costPrice: costValue ?? row.costPrice,
        salesPrice: nextSalesPrice,
        total: totalValue || "",
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
    const invalidSection = validSections.find((section) => section.validRows.some(
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

    if (validSections.some((section) => !section.customerName.trim())) {
      toast.error("Add a customer name for every sales section.")
      return
    }

    if (invalidSection) {
      toast.error("Each sales row requires cost price and a sales price.")
      return
    }

    const payload = {
      date: selectedRange.from && selectedRange.to ? { from: selectedRange.from, to: selectedRange.to } : { date: selectedDate },
      sections: validSections.map((section) => ({
        customerName: section.customerName.trim(),
        paymentMethod: section.paymentMethod || undefined,
        cashPaid: section.cashPaid === "" ? undefined : Number(section.cashPaid),
        posPayment: section.posPayment === "" ? undefined : Number(section.posPayment),
        change: section.change === "" ? undefined : Number(section.change),
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
      if (editId) {
        router.push("/sales")
      }
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
          const sectionCustomers = filteredCustomers(section.customerName)
          const sectionTotalValue = sectionTotal(section)
          return <div key={section.id} className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="relative flex flex-1 flex-col gap-2 md:max-w-sm">
                <Label htmlFor={`customer-name-${section.id}`}>Customer {sectionIndex + 1}</Label>
                <input id={`customer-name-${section.id}`} type="text" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={section.customerName} onFocus={() => section.customerName.trim().length >= 3 && setCustomerDropdownOpen(true)} onChange={(event) => { const value = event.target.value; updateSection(section.id, { customerName: value }); setCustomerDropdownOpen(true) }} onBlur={() => window.setTimeout(() => setCustomerDropdownOpen(false), 150)} placeholder="Enter customer name" />
                {customerDropdownOpen && sectionCustomers.length > 0 ? <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">{sectionCustomers.map((name) => <button key={name} type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-accent" onMouseDown={(event) => { event.preventDefault(); updateSection(section.id, { customerName: name }); setCustomerDropdownOpen(false) }}>{name}</button>)}</div> : null}
              </div>
              {sectionIndex === 0 ? <div className="flex flex-col gap-2 md:max-w-xs"><Label htmlFor="sales-date">Date</Label><input id="sales-date" type="date" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={format(selectedDate, "yyyy-MM-dd")} onChange={(event) => { setDateMode("single"); setSelectedDate(new Date(event.target.value)); setSelectedRange({ from: undefined, to: undefined }) }} /></div> : null}
              <label className="flex items-center gap-2 rounded border px-3 py-2 text-sm"><input type="checkbox" checked={section.globalWholesale} onChange={(event) => { const enabled = event.target.checked; handleRowChange(section, section.rows.map((row) => ({ ...row, wholesale: enabled })), enabled) }} />Wholesale</label>
            </div>
            <div className="rounded-lg border bg-card p-2 sm:p-4 max-w-full">
              <Tables columns={salesColumns} defaultRowCount={4} rows={section.rows} onRowsChange={(rows) => handleRowChange(section, rows)} autocomplete={{ productName: productNames }} showTotals minWidth="1300px" focusRowIndex={sectionIndex === 0 ? focusRowIndex : undefined} extraActions={sectionIndex === customerSections.length - 1 ? <Button type="button" variant="outline" onClick={() => setCustomerSections((current) => [...current, createCustomerSection()])}>New customer</Button> : null} />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4 border-t pt-4">
              <div className="mr-auto"><p className="text-xs uppercase tracking-wide text-muted-foreground">Customer total</p><p className="text-xl font-bold">₦{sectionTotalValue.toLocaleString()}</p></div>
              <div className="flex items-center gap-3">{(["cash", "pos", "cash&pos"] as const).map((method) => <label key={method} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={section.paymentMethod === method} onChange={(event) => setSectionPaymentMethod(section, event.target.checked ? method : "")} />{method === "cash&pos" ? "Cash & POS" : method.toUpperCase()}</label>)}</div>
              <label className="flex items-center gap-2 text-sm">Cash<input type="number" min="0" step="0.01" className="w-28 rounded border bg-transparent px-2 py-1" value={section.cashPaid} onChange={(event) => updateSection(section.id, { cashPaid: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm">POS<input type="number" min="0" step="0.01" className="w-28 rounded border bg-transparent px-2 py-1" value={section.posPayment} onChange={(event) => updateSection(section.id, { posPayment: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm">Change<input type="number" min="0" step="0.01" className="w-28 rounded border bg-transparent px-2 py-1" value={section.change} onChange={(event) => updateSection(section.id, { change: event.target.value })} /></label>
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
        <Button onClick={handleSubmit} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving..." : editId ? "Update sales" : "Save sales"}</Button>
        <span className="text-sm text-muted-foreground">Selected: {currentLabel}</span>
        <span className="text-sm text-muted-foreground">Customers: {totalCustomers}</span>
        {loadingProducts ? <span className="text-sm">Loading products...</span> : null}
      </div>
    </div>
  )
}

export default SalesPage
