import { InventoryShell } from "@/components/inventory-shell"

const columns = [
  { key: "sn", label: "S/N", type: "number" as const }, { key: "customerSn", label: "Customer S/N", type: "number" as const }, { key: "productName", label: "Product Name", type: "text" as const }, { key: "pack", label: "Pack", type: "boolean" as const }, { key: "packQty", label: "Pack Qty", type: "number" as const }, { key: "pcsCount", label: "Pcs/Pack", type: "number" as const }, { key: "pcsQty", label: "Pcs Qty", type: "number" as const }, { key: "totalPcs", label: "Total Pcs", type: "number" as const }, { key: "costPrice", label: "Cost Price", type: "number" as const }, { key: "packSalesPrice", label: "Pack Sales Price", type: "number" as const }, { key: "pcsSalesPrice", label: "Pcs Sales Price", type: "number" as const }, { key: "price", label: "Price", type: "number" as const }, { key: "total", label: "Total", type: "number" as const },
]

export default function SalesPage() { return <InventoryShell mode="sales" columns={columns} /> }