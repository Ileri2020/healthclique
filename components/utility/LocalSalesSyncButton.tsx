"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isLocalDevelopment, pruneSyncedLocalSales, readLocalSales, updateLocalSale } from "@/lib/local-sales"
import { pruneSyncedLocalCounts, readLocalCounts, updateLocalCount } from "@/lib/local-counts"

type Props = { fullWidth?: boolean }

export function LocalSalesSyncButton({ fullWidth = false }: Props) {
  const [isLocal, setIsLocal] = useState(false)
  const [pendingSales, setPendingSales] = useState(0)
  const [pendingCounts, setPendingCounts] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = () => {
    setPendingSales(readLocalSales().filter((sale) => !sale.syncedAt).length)
    setPendingCounts(readLocalCounts().filter((count) => !count.syncedAt).length)
  }

  useEffect(() => {
    const local = isLocalDevelopment()
    setIsLocal(local)
    if (!local) return
    pruneSyncedLocalSales()
    pruneSyncedLocalCounts()
    refreshCount()
    const onChange = () => refreshCount()
    const cleanupTimer = window.setInterval(() => {
      pruneSyncedLocalSales()
      pruneSyncedLocalCounts()
    }, 60_000)
    window.addEventListener("healthclique:local-data-changed", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.clearInterval(cleanupTimer)
      window.removeEventListener("healthclique:local-data-changed", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const syncOfflineData = async () => {
    const sales = readLocalSales().filter((sale) => !sale.syncedAt)
    const counts = readLocalCounts().filter((count) => !count.syncedAt)
    if (!sales.length && !counts.length) return
    setSyncing(true)
    let salesSynced = 0
    let countsSynced = 0
    const failures: string[] = []

    for (const sale of sales) {
      try {
        const response = await fetch("/api/inventory/sales/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localSaleId: sale.localId, staffName: sale.staffName, ...sale.payload }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || "Could not sync sale")
        updateLocalSale(sale.localId, { syncedAt: new Date().toISOString() })
        salesSynced += 1
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Unable to sync a local sale")
      }
    }

    for (const count of counts) {
      try {
        const response = await fetch("/api/inventory/count/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localCountId: count.localId, staffName: count.staffName, ...count.payload }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || "Could not sync stock count")
        updateLocalCount(count.localId, { syncedAt: new Date().toISOString() })
        countsSynced += 1
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Unable to sync a local stock count")
      }
    }

    pruneSyncedLocalSales()
    pruneSyncedLocalCounts()
    if (failures.length) {
      toast.error(`${salesSynced} sales and ${countsSynced} counts synced; ${failures.length} item(s) need retry. ${failures[0]}`)
    } else {
      toast.success(`${salesSynced} sale${salesSynced === 1 ? "" : "s"} and ${countsSynced} stock count${countsSynced === 1 ? "" : "s"} synced`)
    }
    refreshCount()
    setSyncing(false)
  }

  if (!isLocal) return null
  const totalPending = pendingSales + pendingCounts
  const buttonLabel = fullWidth
    ? `Sync ${pendingSales} sales · ${pendingCounts} counts`
    : `Sync offline${totalPending ? ` (${totalPending})` : ""}`

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void syncOfflineData()}
      disabled={syncing || totalPending === 0}
      className={fullWidth ? "w-full justify-start gap-2" : "shrink-0 gap-2 px-3"}
      aria-label={`Sync ${pendingSales} local sales and ${pendingCounts} local stock counts to database`}
      title="Offline sales and stock counts stay on this device until synced. Synced records are removed locally after 3 days."
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing…" : buttonLabel}
    </Button>
  )
}