import { InventoryShell } from "@/components/inventory-shell"

const columns = [
  { key: "sn", label: "S/N", type: "number" as const },
  { key: "productName", label: "Product Name", type: "text" as const },
  { key: "carton", label: "Carton", type: "boolean" as const },
  { key: "pack", label: "Pack", type: "boolean" as const },
  { key: "pcsQty", label: "Pcs Qty", type: "number" as const },
  { key: "totalPcs", label: "Total Pcs", type: "number" as const },
  { key: "wholesale", label: "Wholesale", type: "boolean" as const },
  { key: "salesPrice", label: "Sales Price", type: "number" as const },
  { key: "total", label: "Total Price", type: "number" as const },
]

export default function SalesPage() { return <InventoryShell mode="sales" columns={columns} /> }