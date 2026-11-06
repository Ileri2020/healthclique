import { requireInventoryPageAccess } from "@/lib/inventory-page-access"

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireInventoryPageAccess()
  return children
}