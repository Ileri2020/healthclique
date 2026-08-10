"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tables, TableColumn, TableRow } from "@/components/myComponents/tables"
import { toast } from "sonner"

const salesColumns: TableColumn[] = [
  { key: "sn", label: "S/N", type: "number", required: true },
  { key: "customerSn", label: "Customer S/N", type: "number", required: true },
  { key: "productName", label: "Product Name", type: "text", required: true },
  { key: "pack", label: "Pack", type: "boolean" },
  { key: "price", label: "Price", type: "number" },
  { key: "total", label: "Total", type: "number" },
]

interface InventoryProduct {
  id: string
  name: string
}

const createBlankSalesRow = () => ({
  sn: "",
  customerSn: "",
  productName: "",
  pack: false,
  price: "",
  total: "",
})

const SalesPage = () => {
  const [tableRows, setTableRows] = useState<TableRow[]>(
    () => Array.from({ length: 4 }, createBlankSalesRow)
  )
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [cachedProducts, setCachedProducts] = useState<InventoryProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const productNames = useMemo(
    () => cachedProducts.map((product) => product.name),
    [cachedProducts]
  )

  useEffect(() => {
    loadInventoryProducts()
  }, [])

  const loadInventoryProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch("/api/inventory/products")
      const data = await response.json()
      setCachedProducts(data || [])
    } catch (error) {
      console.error(error)
      toast.error("Unable to load inventory products")
    } finally {
      setLoadingProducts(false)
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
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "PPP")} - ${format(selectedRange.to, "PPP")}`
    }
    return format(selectedDate, "PPP")
  }, [selectedDate, selectedRange])

  const handleRowChange = (rows: TableRow[]) => {
    setTableRows(rows)
  }

  const handleSubmit = async () => {
    const validRows = tableRows.filter((row) => row.productName && row.customerSn)
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
                  onChange={(event) =>
                    setSelectedRange((prev) => ({
                      ...prev,
                      from: event.target.value ? new Date(event.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="range-to">Range to</Label>
                <input
                  id="range-to"
                  type="date"
                  className="mt-2 w-full rounded border bg-transparent px-3 py-2 text-sm"
                  value={selectedRange.to ? format(selectedRange.to, "yyyy-MM-dd") : ""}
                  onChange={(event) =>
                    setSelectedRange((prev) => ({
                      ...prev,
                      to: event.target.value ? new Date(event.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDateRangeOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Tables
          columns={salesColumns}
          defaultRowCount={4}
          rows={tableRows}
          onRowsChange={handleRowChange}
          autocomplete={{ productName: productNames }}
          restrictToOptions={["productName"]}
          showTotals
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
