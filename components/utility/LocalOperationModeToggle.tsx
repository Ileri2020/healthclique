"use client"

import { Button } from "@/components/ui/button"
import { useLocalOperationMode } from "@/lib/local-operation-mode"

export function LocalOperationModeToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const { mode, isLocal, setMode } = useLocalOperationMode()
  if (!isLocal) return null

  return (
    <div className={`flex items-center gap-1 rounded-lg border bg-muted/40 p-1 ${fullWidth ? "w-full" : "shrink-0"}`} role="group" aria-label="Localhost save mode">
      <Button type="button" size="sm" variant={mode === "online" ? "default" : "ghost"} className={`h-8 ${fullWidth ? "flex-1" : "px-2"}`} onClick={() => setMode("online")} aria-pressed={mode === "online"}>
        Online
      </Button>
      <Button type="button" size="sm" variant={mode === "offline" ? "default" : "ghost"} className={`h-8 ${fullWidth ? "flex-1" : "px-2"}`} onClick={() => setMode("offline")} aria-pressed={mode === "offline"}>
        Offline
      </Button>
    </div>
  )
}
