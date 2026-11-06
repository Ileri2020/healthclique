"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isLocalDevelopment, pruneSyncedLocalSales, readLocalSales, updateLocalSale } from "@/lib/local-sales"
import { pruneSyncedLocalCounts, readLocalCounts, updateLocalCount } from "@/lib/local-counts"
import { pruneSyncedLocalStocks, readLocalStocks, updateLocalStock } from "@/lib/local-stocks"

type Props = { fullWidth?: boolean }

export function LocalSalesSyncButton({ fullWidth = false }: Props) {
  const [isLocal, setIsLocal] = useState(false)
  const [pendingSales, setPendingSales] = useState(0)
  const [pendingCounts, setPendingCounts] = useState(0)
  const [pendingStocks, setPendingStocks] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = () => {
    setPendingSales(readLocalSales().filter((sale) => !sale.syncedAt).length)
    setPendingCounts(readLocalCounts().filter((count) => !count.syncedAt).length)
    setPendingStocks(readLocalStocks().filter((stock) => !stock.syncedAt).length)
  }

  useEffect(() => {
    const local = isLocalDevelopment()
    setIsLocal(local)
    if (!local) return
    pruneSyncedLocalSales()
    pruneSyncedLocalCounts()
    pruneSyncedLocalStocks()
    refreshCount()
    const onChange = () => refreshCount()
    const cleanupTimer = window.setInterval(() => {
      pruneSyncedLocalSales()
      pruneSyncedLocalCounts()
      pruneSyncedLocalStocks()
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
    const stocks = readLocalStocks().filter((stock) => !stock.syncedAt)
    if (!sales.length && !counts.length && !stocks.length) return
    setSyncing(true)
    let salesSynced = 0
    let countsSynced = 0
    let stocksSynced = 0
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

    for (const stock of stocks) {
      try {
        const response = await fetch("/api/inventory/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localSyncId: stock.localId, ...stock.payload }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || "Could not sync stock intake")
        updateLocalStock(stock.localId, { syncedAt: new Date().toISOString() })
        stocksSynced += 1
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Unable to sync a local stock intake")
      }
    }

    pruneSyncedLocalSales()
    pruneSyncedLocalCounts()
    pruneSyncedLocalStocks()
    if (failures.length) {
      toast.error(`${salesSynced} sales, ${countsSynced} counts, and ${stocksSynced} stock intakes synced; ${failures.length} item(s) need retry. ${failures[0]}`)
    } else {
      toast.success(`${salesSynced} sale${salesSynced === 1 ? "" : "s"}, ${countsSynced} count${countsSynced === 1 ? "" : "s"}, and ${stocksSynced} stock intake${stocksSynced === 1 ? "" : "s"} synced`)
    }
    refreshCount()
    setSyncing(false)
  }

  if (!isLocal) return null
  const totalPending = pendingSales + pendingCounts + pendingStocks
  const buttonLabel = fullWidth
    ? `Sync ${pendingSales} sales · ${pendingCounts} counts · ${pendingStocks} stock`
    : `Sync offline${totalPending ? ` (${totalPending})` : ""}`

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void syncOfflineData()}
      disabled={syncing || totalPending === 0}
      className={fullWidth ? "w-full justify-start gap-2" : "shrink-0 gap-2 px-3"}
      aria-label={`Sync ${pendingSales} local sales, ${pendingCounts} stock counts, and ${pendingStocks} stock intakes to database`}
      title="Offline sales, stock counts, and stock intakes stay on this device until synced. Synced records are removed locally after 3 days."
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing…" : buttonLabel}
    </Button>
  )
}