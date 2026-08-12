"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"

const salesColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", required: true, className: "w-10" },
  { key: "customerSn", label: "Customer S/N", type: "number", required: true, className: "w-10" },
  { key: "productName", label: "Product Name", type: "text", required: true },
  { key: "pack", label: "Pack", type: "boolean", className: "w-10" },
  { key: "packQty", label: "Pack Qty", type: "number", className: "w-20" },
  { key: "pcsCount", label: "Pcs/Pack", type: "number", className: "w-20" },
  { key: "pcsQty", label: "Pcs Qty", type: "number", className: "w-20" },
  { key: "totalPcs", label: "Total Pcs", type: "number", className: "w-24" },
  { key: "costPrice", label: "Cost Price", type: "number", required: true, className: "w-32" },
  { key: "packSalesPrice", label: "Pack Sales Price", type: "number", className: "w-32" },
  { key: "pcsSalesPrice", label: "Pcs Sales Price", type: "number", className: "w-32" },
  { key: "price", label: "Price", type: "number", className: "w-32" },
  { key: "total", label: "Total", type: "number", className: "w-40" },
]

type InventoryProductName = string

const createBlankSalesRow = () => ({
  sn: "",
  customerSn: "",
  productName: "",
  pack: false,
  packQty: "",
  pcsCount: "",
  pcsQty: "",
  totalPcs: "",
  qty: "",
  costPrice: "",
  packSalesPrice: "",
  pcsSalesPrice: "",
  price: "",
  total: "",
})

const SalesPage = () => {
  const [tableRows, setTableRows] = useState<TableRow[]>(
    () => Array.from({ length: 4 }, createBlankSalesRow)
  )
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateMode, setDateMode] = useState<"single" | "range">("single")
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [cachedProducts, setCachedProducts] = useState<InventoryProductName[]>([])
  const [stockPricing, setStockPricing] = useState<Record<string, { costPrice?: number; packSalesPrice?: number; pcsSalesPrice?: number }>>({})
  const [loadingProducts, setLoadingProducts] = useState(false)

  const productNames = useMemo(
    () => cachedProducts,
    [cachedProducts]
  )

  useEffect(() => {
    loadInventoryProducts()
    loadStockPricing()
  }, [])

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
                packSalesPrice: item.packSalesPrice,
                pcsSalesPrice: item.pcsSalesPrice,
              }
            }
            return acc
          }, {} as Record<string, { costPrice?: number; packSalesPrice?: number; pcsSalesPrice?: number }>)
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  const totalCustomers = useMemo(() => {
    const customerSet = new Set<number>()
    tableRows.forEach((row) => {
      if (row.customerSn !== undefined && row.customerSn !== "") {
        const value = Number(row.customerSn)
        if (!Number.isNaN(value)) {
          customerSet.add(value)
        }
      }
    })
    return customerSet.size
  }, [tableRows])

  const currentLabel = useMemo(() => {
    if (dateMode === "range" && selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "PPP")} - ${format(selectedRange.to, "PPP")}`
    }
    return format(selectedDate, "PPP")
  }, [dateMode, selectedDate, selectedRange])

  const handleRowChange = (rows: TableRow[]) => {
    const normalizedRows = rows.map((row) => {
      const productName = typeof row.productName === "string" ? row.productName : ""
      const stockInfo = productName ? stockPricing[productName] : undefined
      const costValue = row.costPrice === "" || row.costPrice === undefined || row.costPrice === null
        ? stockInfo?.costPrice
        : Number(row.costPrice)

      const pkQty = row.packQty !== "" && row.packQty !== undefined && row.packQty !== null
        ? Number(row.packQty)
        : (row.qty !== "" && row.qty !== undefined && row.qty !== null ? Number(row.qty) : 0)
      const pCount = row.pcsCount !== "" && row.pcsCount !== undefined && row.pcsCount !== null ? Number(row.pcsCount) : 1
      const pcQty = row.pcsQty !== "" && row.pcsQty !== undefined && row.pcsQty !== null ? Number(row.pcsQty) : 0

      const hasQty = row.packQty !== "" || row.pcsQty !== "" || row.qty !== ""
      const computedTotalPcs = hasQty ? (pkQty * pCount) + pcQty : ""

      const packRequested = Boolean(row.pack) || pkQty > 0
      const pcsRequested = pCount > 0 || pcQty > 0

      const hasPackSales = row.packSalesPrice !== "" && row.packSalesPrice !== undefined && row.packSalesPrice !== null
      const hasPcsSales = row.pcsSalesPrice !== "" && row.pcsSalesPrice !== undefined && row.pcsSalesPrice !== null
      const suggestedSale = costValue !== undefined && !Number.isNaN(costValue)
        ? Number((costValue + 0.3).toFixed(2))
        : undefined

      const packPrice = hasPackSales ? Number(row.packSalesPrice) : (stockInfo?.packSalesPrice ?? suggestedSale)
      const pcsPrice = hasPcsSales ? Number(row.pcsSalesPrice) : (stockInfo?.pcsSalesPrice ?? suggestedSale)

      let calculatedTotal = row.total
      if (pkQty > 0 && packPrice !== undefined) {
        calculatedTotal = Number((pkQty * packPrice + (pcQty > 0 && pcsPrice ? pcQty * pcsPrice : 0)).toFixed(2))
      } else if (pcQty > 0 && pcsPrice !== undefined) {
        calculatedTotal = Number((pcQty * pcsPrice).toFixed(2))
      }

      return {
        ...row,
        costPrice: costValue ?? row.costPrice,
        totalPcs: computedTotalPcs,
        total: calculatedTotal,
        packSalesPrice: packRequested
          ? (hasPackSales ? row.packSalesPrice : (stockInfo?.packSalesPrice ?? suggestedSale ?? row.packSalesPrice))
          : row.packSalesPrice,
        pcsSalesPrice: pcsRequested
          ? (hasPcsSales ? row.pcsSalesPrice : (stockInfo?.pcsSalesPrice ?? suggestedSale ?? row.pcsSalesPrice))
          : row.pcsSalesPrice,
      }
    })

    setTableRows(normalizedRows)
  }

  const handleSubmit = async () => {
    const validRows = tableRows.filter((row) => row.productName && row.customerSn)
    const invalidRow = validRows.find(
      (row) =>
        row.costPrice === "" ||
        row.costPrice === undefined ||
        Number.isNaN(Number(row.costPrice)) ||
        ((row.packSalesPrice === "" || row.packSalesPrice === undefined || row.packSalesPrice === null) &&
          (row.pcsSalesPrice === "" || row.pcsSalesPrice === undefined || row.pcsSalesPrice === null))
    )

    if (invalidRow) {
      toast.error("Each sales row requires cost price plus either pack sales or pcs sales price.")
      return
    }

    const payload = {
      date: selectedRange.from && selectedRange.to ? { from: selectedRange.from, to: selectedRange.to } : { date: selectedDate },
      rows: validRows,
    }

    try {
      const result = await fetch("/api/inventory/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!result.ok) {
        throw new Error("Failed to save sales")
      }
      toast.success("Sales saved")
      setTableRows(Array.from({ length: 4 }, createBlankSalesRow))
    } catch (error) {
      console.error(error)
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
            <Button variant="outline">Select Date / Range</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select date or date range</DialogTitle>
              <DialogDescription>Default is today.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="single-date">Single date</Label>
                <input
                  id="single-date"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(event) => {
                    setDateMode("single")
                    setSelectedDate(new Date(event.target.value))
                    setSelectedRange({ from: undefined, to: undefined })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="range-from">Range from</Label>
                <input
                  id="range-from"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={selectedRange.from ? format(selectedRange.from, "yyyy-MM-dd") : ""}
                  onChange={(event) => {
                    setDateMode("range")
                    setSelectedRange((prev) => ({
                      ...prev,
                      from: event.target.value ? new Date(event.target.value) : undefined,
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
                  value={selectedRange.to ? format(selectedRange.to, "yyyy-MM-dd") : ""}
                  onChange={(event) => {
                    setDateMode("range")
                    setSelectedRange((prev) => ({
                      ...prev,
                      to: event.target.value ? new Date(event.target.value) : undefined,
                    }))
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDateRangeOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card p-2 sm:p-4 overflow-x-auto max-w-full">
        <Tables
          columns={salesColumns}
          defaultRowCount={4}
          rows={tableRows}
          onRowsChange={handleRowChange}
          autocomplete={{ productName: productNames }}
          restrictToOptions={["productName"]}
          showTotals
          minWidth="1300px"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSubmit}>Save sales</Button>
        <span className="text-sm text-muted-foreground">Selected: {currentLabel}</span>
        {loadingProducts ? <span className="text-sm">Loading products...</span> : null}
      </div>
    </div>
  )
}

export default SalesPage
