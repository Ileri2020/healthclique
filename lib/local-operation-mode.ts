"use client"

import { useEffect, useState } from "react"
import { isLocalDevelopment } from "@/lib/local-sales"

export type LocalOperationMode = "online" | "offline"
const MODE_KEY = "healthclique.local-operation-mode.v1"
const MODE_EVENT = "healthclique:local-operation-mode-changed"

export const readLocalOperationMode = (): LocalOperationMode => {
  if (typeof window === "undefined" || !isLocalDevelopment()) return "online"
  return window.localStorage.getItem(MODE_KEY) === "online" ? "online" : "offline"
}

export const writeLocalOperationMode = (mode: LocalOperationMode) => {
  if (typeof window === "undefined" || !isLocalDevelopment()) return
  window.localStorage.setItem(MODE_KEY, mode)
  window.dispatchEvent(new Event(MODE_EVENT))
}

export function useLocalOperationMode() {
  const [mode, setMode] = useState<LocalOperationMode>("offline")
  const [isLocal, setIsLocal] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const local = isLocalDevelopment()
    setIsLocal(local)
    setMode(local ? readLocalOperationMode() : "online")
    setReady(true)
    const update = () => setMode(readLocalOperationMode())
    window.addEventListener(MODE_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(MODE_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])

  return { mode, isLocal, ready, setMode: writeLocalOperationMode }
}
