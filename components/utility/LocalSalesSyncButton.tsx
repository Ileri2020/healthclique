"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isLocalDevelopment, pruneSyncedLocalSales, readLocalSales, updateLocalSale } from "@/lib/local-sales"

type Props = { fullWidth?: boolean }

export function LocalSalesSyncButton({ fullWidth = false }: Props) {
  const [isLocal, setIsLocal] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = () => setPendingCount(readLocalSales().filter((sale) => !sale.syncedAt).length)

  useEffect(() => {
    const local = isLocalDevelopment()
    setIsLocal(local)
    if (!local) return
    pruneSyncedLocalSales()
    refreshCount()
    const onChange = () => refreshCount()
    const cleanupTimer = window.setInterval(pruneSyncedLocalSales, 60_000)
    window.addEventListener("healthclique:local-sales-changed", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.clearInterval(cleanupTimer)
      window.removeEventListener("healthclique:local-sales-changed", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const syncSales = async () => {
    const pending = readLocalSales().filter((sale) => !sale.syncedAt)
    if (!pending.length) return
    setSyncing(true)
    let synced = 0
    try {
      for (const sale of pending) {
        const response = await fetch("/api/inventory/sales/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localSaleId: sale.localId, staffName: sale.staffName, ...sale.payload }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || "Could not sync all local sales")
        updateLocalSale(sale.localId, { syncedAt: new Date().toISOString() })
        synced += 1
      }
      pruneSyncedLocalSales()
      toast.success(`${synced} local sale${synced === 1 ? "" : "s"} synced to the database`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync local sales. Try again when connected.")
    } finally {
      refreshCount()
      setSyncing(false)
    }
  }

  if (!isLocal) return null

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void syncSales()}
      disabled={syncing || pendingCount === 0}
      className={fullWidth ? "w-full justify-start gap-2" : "shrink-0 gap-2 px-3"}
      aria-label={`Sync ${pendingCount} local sales to database`}
      title="Local sales stay on this device until synced. Synced records are removed locally after 3 days."
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing…" : `Sync sales${pendingCount ? ` (${pendingCount})` : ""}`}
    </Button>
  )
}