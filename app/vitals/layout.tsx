import { requireInventoryPageAccess } from "@/lib/inventory-page-access"

export default async function VitalsLayout({ children }: { children: React.ReactNode }) {
  await requireInventoryPageAccess()
  return children
}