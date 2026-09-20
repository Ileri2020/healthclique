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
  { key: "salesPrice", label: "Sales Price", type: "number", className: "min-w-[100px] w-36" },
  { key: "total", label: "Total Price", type: "number", readOnly: true, className: "min-w-[100px] w-36" },
]

type InventoryProductName = string

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

const SalesPage = () => {
  const [tableRows, setTableRows] = useState<TableRow[]>(() => Array.from({ length: 4 }, createBlankSalesRow))
  const [customerName, setCustomerName] = useState("")
  const [globalWholesale, setGlobalWholesale] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"" | "cash" | "pos" | "cash&pos">("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [cashPaid, setCashPaid] = useState("")
  const [posPayment, setPosPayment] = useState("")
  const [change, setChange] = useState("")
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

  const filteredCustomers = useMemo(() => {
    const query = customerName.trim().toLowerCase()
    if (query.length < 3) return []
    return customerList.filter((name) => name.toLowerCase().includes(query)).slice(0, 8)
  }, [customerName, customerList])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/inventory/sales/${editId}`)
      .then((response) => response.json())
      .then((sale) => {
        if (!sale?.sales) return
        setCustomerName(sale.sales[0]?.customerName ?? "")
        setPaymentMethod(sale.paymentMethod ?? "")
        setCashPaid(sale.cashPaid == null ? "" : String(sale.cashPaid))
        setPosPayment(sale.posPayment == null ? "" : String(sale.posPayment))
        setChange(sale.change == null ? "" : String(sale.change))
        if (sale.date) {
          setSelectedDate(new Date(sale.date))
          setViewDate(new Date(sale.date))
          setDateMode("single")
          setSelectedRange({ from: undefined, to: undefined })
        } else if (sale.rangeFrom && sale.rangeTo) {
          setSelectedRange({ from: new Date(sale.rangeFrom), to: new Date(sale.rangeTo) })
          setDateMode("range")
        }
        setTableRows(sale.sales.map((row: TableRow) => ({
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
        })))
        const productName = searchParams.get("product")
        if (productName) setFocusRowIndex(sale.sales.findIndex((row: TableRow) => row.productName === productName))
      })
      .catch(() => toast.error("Unable to load saved sales"))
  }, [editId])

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
              acc[item.productName] = {
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

  const totalCustomers = useMemo(() => {
    const customerSet = new Set<string>()
    if (customerName.trim()) customerSet.add(customerName.trim())
    return customerSet.size
  }, [customerName])

  const totalSalesAmount = useMemo(
    () => tableRows.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [tableRows]
  )

  useEffect(() => {
    const total = totalSalesAmount ? String(Number(totalSalesAmount.toFixed(2))) : ""
    if (paymentMethod === "cash") setCashPaid(total)
    if (paymentMethod === "pos") setPosPayment(total)
  }, [paymentMethod, totalSalesAmount])

  const currentLabel = useMemo(() => {
    if (dateMode === "range" && selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "PPP")} - ${format(selectedRange.to, "PPP")}`
    }
    return format(selectedDate, "PPP")
  }, [dateMode, selectedDate, selectedRange])

  const handleRowChange = (rows: TableRow[], wholesaleOverride = globalWholesale) => {
    setSaveState((current) => current === "saving" ? current : "idle")
    const normalizedRows = rows.map((row, rowIndex) => {
      const productName = typeof row.productName === "string" ? row.productName : ""
      const stockInfo = productName ? stockPricing[productName] : undefined
      const previousRow = tableRows[rowIndex]
      const rowWholesale = Boolean(row.wholesale) || wholesaleOverride
      const previousWholesale = Boolean(previousRow?.wholesale) || globalWholesale
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

      const fallbackPrice = costValue !== undefined && !Number.isNaN(costValue) ? Number((costValue * 1.1).toFixed(2)) : undefined
      const defaultCarton = rowWholesale ? (stockInfo?.wholesaleCartonSalesPrice ?? fallbackPrice) : (stockInfo?.cartonSalesPrice ?? fallbackPrice)
      const defaultPack = rowWholesale ? (stockInfo?.wholesalePackSalesPrice ?? fallbackPrice) : (stockInfo?.packSalesPrice ?? fallbackPrice)
      const defaultPcs = rowWholesale ? (stockInfo?.wholesalePcsSalesPrice ?? fallbackPrice) : (stockInfo?.pcsSalesPrice ?? fallbackPrice)
      const defaultPrice = cartonQty > 0 || Boolean(row.carton)
        ? defaultCarton
        : packQty > 0 || Boolean(row.pack)
        ? defaultPack
        : defaultPcs
      const nextSalesPrice = wholesaleChanged && !row._salesPriceManual
        ? (defaultPrice ?? row.salesPrice)
        : row._salesPriceManual
        ? row.salesPrice
        : row.salesPrice === "" || row.salesPrice === undefined || row.salesPrice === null
        ? (defaultPrice ?? row.salesPrice)
        : row.salesPrice
      const rowPrice = Number(nextSalesPrice || 0)
      const totalValue = cartonQty > 0 || Boolean(row.carton)
        ? Number((cartonQty * rowPrice + (packQty * rowPrice) / packsPerCarton + (pcQty * rowPrice) / (packsPerCarton * pCount)).toFixed(2))
        : packQty > 0 || Boolean(row.pack)
        ? Number((cartonQty * packsPerCarton * rowPrice + packQty * rowPrice + (pcQty * rowPrice) / pCount).toFixed(2))
        : Number(((computedTotalPcs === "" ? 0 : Number(computedTotalPcs)) * rowPrice).toFixed(2))

      return {
        ...row,
        wholesale: rowWholesale,
        totalPcs: computedTotalPcs,
        costPrice: costValue ?? row.costPrice,
        salesPrice: nextSalesPrice,
        total: totalValue || "",
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
        row.salesPrice === "" || row.salesPrice === undefined || row.salesPrice === null
    )

    if (!validRows.length) {
      toast.error("Add at least one product before saving sales.")
      return
    }

    if (change.trim() && !customerName.trim()) {
      toast.error("Add a customer name before entering change.")
      return
    }

    if (invalidRow) {
      toast.error("Each sales row requires cost price and a sales price.")
      return
    }

    const payload = {
      customerName: customerName.trim(),
      date: selectedRange.from && selectedRange.to ? { from: selectedRange.from, to: selectedRange.to } : { date: selectedDate },
      paymentMethod: paymentMethod || undefined,
      cashPaid: cashPaid === "" ? undefined : Number(cashPaid),
      posPayment: posPayment === "" ? undefined : Number(posPayment),
      change: change === "" ? undefined : Number(change),
      rows: validRows.map((row) => ({ ...row, customerName: customerName.trim(), wholesale: Boolean(row.wholesale) || globalWholesale })),
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
      setTableRows(Array.from({ length: 4 }, createBlankSalesRow))
      setCustomerName("")
      setGlobalWholesale(false)
      setPaymentMethod("")
      setPaymentDialogOpen(false)
      setCashPaid("")
      setPosPayment("")
      setChange("")
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

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex flex-1 flex-col gap-2 md:max-w-sm">
            <Label htmlFor="customer-name">Customer name</Label>
            <input
              id="customer-name"
              type="text"
              className="w-full rounded border bg-transparent px-3 py-2 text-sm"
              value={customerName}
              onFocus={() => {
                if (customerName.trim().length >= 3) setCustomerDropdownOpen(true)
              }}
              onChange={(event) => {
                const val = event.target.value
                setCustomerName(val)
                setCustomerDropdownOpen(val.trim().length >= 3)
              }}
              onBlur={() => {
                window.setTimeout(() => setCustomerDropdownOpen(false), 150)
              }}
              placeholder="Enter customer name"
            />
            {customerDropdownOpen && filteredCustomers.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {filteredCustomers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-accent"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      setCustomerName(name)
                      setCustomerDropdownOpen(false)
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 md:max-w-xs">
            <Label htmlFor="sales-date">Date</Label>
            <input
              id="sales-date"
              type="date"
              className="w-full rounded border bg-transparent px-3 py-2 text-sm"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(event) => {
                setDateMode("single")
                setSelectedDate(new Date(event.target.value))
                setSelectedRange({ from: undefined, to: undefined })
              }}
            />
          </div>
          <label className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={globalWholesale}
              onChange={(event) => {
                const enabled = event.target.checked
                setGlobalWholesale(enabled)
                handleRowChange(tableRows.map((row) => ({ ...row, wholesale: enabled })), enabled)
              }}
            />
            Wholesale
          </label>
        </div>

        <div className="rounded-lg border bg-card p-2 sm:p-4 max-w-full">
          <Tables
            columns={salesColumns}
            defaultRowCount={4}
            rows={tableRows}
            onRowsChange={handleRowChange}
            autocomplete={{ productName: productNames }}
            showTotals
            minWidth="1300px"
            focusRowIndex={focusRowIndex}
          />
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cash and POS payment</DialogTitle>
            <DialogDescription>Enter either payment amount or both amounts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cash-paid">Cash paid</Label>
              <input id="cash-paid" type="number" min="0" step="0.01" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={cashPaid} onChange={(event) => setCashPaid(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-payment">POS payment</Label>
              <input id="pos-payment" type="number" min="0" step="0.01" className="w-full rounded border bg-transparent px-3 py-2 text-sm" value={posPayment} onChange={(event) => setPosPayment(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPaymentDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={handleSubmit} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving..." : editId ? "Update sales" : "Save sales"}</Button>
        <div className="flex items-center gap-3">
          {(["cash", "pos", "cash&pos"] as const).map((method) => (
            <label key={method} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={paymentMethod === method}
                onChange={(event) => {
                  if (!event.target.checked) {
                    setPaymentMethod("")
                    return
                  }
                  setPaymentMethod(method)
                  if (method === "cash") setCashPaid(totalSalesAmount ? String(Number(totalSalesAmount.toFixed(2))) : "")
                  if (method === "pos") setPosPayment(totalSalesAmount ? String(Number(totalSalesAmount.toFixed(2))) : "")
                  if (method === "cash&pos") setPaymentDialogOpen(true)
                }}
              />
              {method === "cash&pos" ? "Cash & POS" : method.toUpperCase()}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Change
          <input type="number" min="0" step="0.01" className="w-28 rounded border bg-transparent px-3 py-2 text-sm" value={change} onChange={(event) => setChange(event.target.value)} />
        </label>
        <span className="text-sm text-muted-foreground">Selected: {currentLabel}</span>
        <span className="text-sm text-muted-foreground">Customers: {totalCustomers}</span>
        {loadingProducts ? <span className="text-sm">Loading products...</span> : null}
      </div>
    </div>
  )
}

export default SalesPage
