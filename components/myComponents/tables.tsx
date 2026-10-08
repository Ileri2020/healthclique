"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GitMerge } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type TableColumn = {
  key: string
  label: string
  type: "text" | "number" | "boolean" | "date"
  previousValueKey?: string
  previousValueToggleKey?: string
  autoValueKey?: string
  required?: boolean
  className?: string
  readOnly?: boolean
  conditionalFields?: {
    key: string
    label: string
  }[]
}

export type AutocompleteOption = string | { label: string; value: string; onAction?: () => void; actionLabel?: string }

export type TableRow = Record<string, string | number | boolean | undefined>

interface TablesProps {
  columns: TableColumn[]
  defaultRowCount?: number
  rows?: TableRow[]
  onRowsChange?: (rows: TableRow[]) => void
  autocomplete?: Record<string, AutocompleteOption[]>
  restrictToOptions?: string[]
  showTotals?: boolean
  minWidth?: string
  fixedLayout?: boolean
  stickyHeader?: boolean
  readOnly?: boolean
  focusRowIndex?: number
  extraActions?: ReactNode
  snRestartKey?: string
  groupTotalKey?: string
  groupTotalContent?: (range: { startIndex: number; endIndex: number; total: number }) => ReactNode
}

function createBlankRow(columns: TableColumn[]) {
  return columns.reduce((acc, column) => {
    acc[column.key] = column.type === "boolean" ? false : ""
    return acc
  }, {} as TableRow)
}

export function Tables({
  columns,
  defaultRowCount = 4,
  rows,
  onRowsChange,
  autocomplete,
  showTotals = false,
  minWidth = "1100px",
  fixedLayout = false,
  stickyHeader = false,
  readOnly = false,
  focusRowIndex,
  extraActions,
  snRestartKey,
  groupTotalKey,
  groupTotalContent,
}: TablesProps) {
  const tableRootRef = useRef<HTMLDivElement>(null)
  const stickyHeaderHostRef = useRef<HTMLDivElement>(null)
  const [portalReady, setPortalReady] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState<{ rowIndex: number; columnKey: string } | null>(null)
  const [quantityDialog, setQuantityDialog] = useState<{ rowIndex: number; column: TableColumn } | null>(null)
  const [internalRows, setInternalRows] = useState<TableRow[]>(
    () => Array.from({ length: defaultRowCount }, () => createBlankRow(columns))
  )

  const controlled = rows !== undefined
  const activeRows = controlled ? rows! : internalRows

  useEffect(() => setPortalReady(true), [])

  useEffect(() => {
    if (!stickyHeader || !portalReady) return
    const root = tableRootRef.current
    const host = stickyHeaderHostRef.current
    const scrollViewport = root?.querySelector<HTMLElement>(".sticky-table-scroll")
    const sourceTable = scrollViewport?.querySelector<HTMLTableElement>("table")
    const sourceHead = sourceTable?.querySelector<HTMLTableSectionElement>("thead")
    if (!scrollViewport || !sourceTable || !sourceHead || !host) return

    const floatingTable = sourceTable.cloneNode(false) as HTMLTableElement
    floatingTable.style.cssText = sourceTable.style.cssText
    floatingTable.style.width = `${sourceTable.scrollWidth}px`
    floatingTable.style.minWidth = `${sourceTable.scrollWidth}px`
    floatingTable.style.margin = "0"
    floatingTable.appendChild(sourceHead.cloneNode(true))
    host.replaceChildren(floatingTable)

    const syncStickyHeader = () => {
      const navbarHeader = document.querySelector<HTMLElement>("header.sticky")
      const navbarBottom = navbarHeader?.getBoundingClientRect().bottom ?? 0
      const viewportRect = scrollViewport.getBoundingClientRect()
      const headerHeight = sourceHead.getBoundingClientRect().height
      const shouldShow = viewportRect.top < navbarBottom && viewportRect.bottom > navbarBottom + headerHeight

      host.style.display = shouldShow ? "block" : "none"
      if (!shouldShow) return

      host.style.top = `${navbarBottom}px`
      host.style.left = `${viewportRect.left}px`
      host.style.width = `${scrollViewport.clientWidth}px`
      floatingTable.style.transform = `translateX(-${scrollViewport.scrollLeft}px)`
    }

    scrollViewport.addEventListener("scroll", syncStickyHeader, { passive: true })
    window.addEventListener("scroll", syncStickyHeader, { passive: true, capture: true })
    window.addEventListener("resize", syncStickyHeader)
    const resizeObserver = new ResizeObserver(syncStickyHeader)
    resizeObserver.observe(scrollViewport)
    resizeObserver.observe(sourceTable)
    syncStickyHeader()

    return () => {
      scrollViewport.removeEventListener("scroll", syncStickyHeader)
      window.removeEventListener("scroll", syncStickyHeader, true)
      window.removeEventListener("resize", syncStickyHeader)
      resizeObserver.disconnect()
      host.replaceChildren()
    }
  }, [stickyHeader, portalReady, activeRows.length, columns, minWidth])

  useEffect(() => {
    if (controlled) return
    setInternalRows(Array.from({ length: defaultRowCount }, () => createBlankRow(columns)))
  }, [controlled, defaultRowCount, columns])

  useEffect(() => {
    if (!controlled) return
    setInternalRows(rows ?? [])
  }, [controlled, rows])

  const updateRows = (updated: TableRow[]) => {
    if (controlled) {
      onRowsChange?.(updated)
    } else {
      setInternalRows(updated)
      onRowsChange?.(updated)
    }
  }

  const handleCellChange = (
    rowIndex: number,
    column: TableColumn,
    value: string | boolean
  ) => {
    const newRows = [...activeRows]
    const row = { ...newRows[rowIndex] }

    if (column.type === "boolean") {
      row[column.key] = Boolean(value)
    } else if (column.type === "number") {
      row[column.key] = value === "" ? "" : Number(value)
    } else {
      row[column.key] = value
    }

    if (column.key === "salesPrice") {
      row._salesPriceManual = true
    }
    if (column.key === "total") {
      row._totalManual = true
    }
    if (column.key === "salesPrice") {
      row._totalManual = false
    }

    newRows[rowIndex] = row
    updateRows(newRows)
  }

  const [snEditableRows, setSnEditableRows] = useState<Record<number, boolean>>({})

  const addRow = () => {
    updateRows([
      ...activeRows,
      ...Array.from({ length: 5 }, () => createBlankRow(columns)),
    ])
  }

  const footerTotals = useMemo(() => {
    if (!showTotals) {
      return null
    }

    return columns.reduce((acc, column) => {
      if (column.type === "number") {
        acc[column.key] = activeRows.reduce((sum, row) => {
          const value = row[column.key]
          return sum + (typeof value === "number" ? value : Number(value) || 0)
        }, 0)
      }
      return acc
    }, {} as Record<string, number>)
  }, [activeRows, columns, showTotals])

  useEffect(() => {
    if (focusRowIndex !== undefined && focusRowIndex >= 0) {
      const targetId = `cell-${focusRowIndex}-productName`
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId)
        if (element) {
          element.focus({ preventScroll: true })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [focusRowIndex])

  const filteredSuggestions = useMemo(() => {
    if (!activeSuggestion) return []
    const { rowIndex, columnKey } = activeSuggestion
    const val = String(activeRows[rowIndex]?.[columnKey] ?? "").toLowerCase()
    if (val.length < 3) return []
    const list = autocomplete?.[columnKey] ?? []
    return list.filter((item) => (typeof item === "string" ? item : item.label).toLowerCase().includes(val)).slice(0, 10)
  }, [activeSuggestion, activeRows, autocomplete])

  const serialNumberForRow = (rowIndex: number) => {
    if (!snRestartKey) return rowIndex + 1
    let serialNumber = 1
    for (let index = 1; index <= rowIndex; index += 1) {
      serialNumber = activeRows[index]?.[snRestartKey] ? 1 : serialNumber + 1
    }
    return serialNumber
  }

  const groupTotalForRows = (startIndex: number, endIndex: number, columnKey: string) =>
    activeRows.slice(startIndex, endIndex + 1).reduce((sum, row) => {
      const value = row[columnKey]
      return sum + (typeof value === "number" ? value : Number(value) || 0)
    }, 0)

  return (
    <>
      {stickyHeader && portalReady ? createPortal(
        <div
          ref={stickyHeaderHostRef}
          aria-hidden="true"
          className="pointer-events-none fixed z-20 overflow-hidden bg-background shadow-sm"
          style={{ top: 0, left: 0, display: "none" }}
        />,
        document.body,
      ) : null}
    <div ref={tableRootRef} className="relative w-full max-w-full pb-14">
      <div className="w-full max-w-full touch-pan-x touch-pan-y scrollbar-thin [webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]">
        <Table className={`bg-foreground/10 ${fixedLayout ? "table-fixed" : ""}`} containerClassName={stickyHeader ? "sticky-table-scroll max-h-[65vh] overflow-auto overscroll-contain" : undefined} style={{ minWidth }}>
        <TableHeader>
          <TableRow className="border-b border-background border-2">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.key === "productName" ? (fixedLayout ? "w-96 max-w-sm min-w-0" : "w-[300px] min-w-[260px] max-w-sm") : ""} ${column.type === "boolean" ? "w-[50px] max-w-[50px] min-w-[50px] px-1 break-words" : ""} ${column.className ?? ""}`}
              >
                <div className="flex items-center justify-center text-center">{column.label}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeRows.map((row, rowIndex) => {
            const groupStartIndex = groupTotalKey
              ? activeRows.slice(0, rowIndex + 1).reduce((startIndex, currentRow, index) => currentRow[groupTotalKey] ? index : startIndex, 0)
              : 0
            const isGroupEnd = groupTotalKey && (!activeRows[rowIndex + 1] || Boolean(activeRows[rowIndex + 1][groupTotalKey]))
            return <Fragment key={rowIndex}>
            <TableRow className="border-b border-background border-2">
              {columns.map((column) => {
                const value = row[column.key]
                const isSn = column.key === "sn"
                const isSnEditable = Boolean(snEditableRows[rowIndex])
                const displayValue = isSn
                  ? String(snRestartKey ? serialNumberForRow(rowIndex) : value === undefined || value === "" ? rowIndex + 1 : value)
                  : value === undefined || value === null
                  ? ""
                  : String(value)

                const isCurrentSuggestionActive = activeSuggestion?.rowIndex === rowIndex && activeSuggestion?.columnKey === column.key

                return (
                  <TableCell
                    key={column.key}
                    className={`align-top py-2 justify-center items-center text-center ${column.key === "productName" ? (fixedLayout ? "w-96 max-w-sm min-w-0" : "w-[300px] min-w-[260px] max-w-sm") : ""} ${column.type === "boolean" ? "w-[50px] max-w-[50px] min-w-[50px] px-1" : ""} ${column.type === "number" ? "max-w-[120px]" : ""} ${column.className ?? ""}`}
                  >
                    {column.type === "boolean" ? (
                      <div className="flex w-full max-w-[42px] items-center justify-center gap-0.5 whitespace-nowrap">
                        <Checkbox
                          checked={Boolean(value)}
                          disabled={readOnly}
                          onCheckedChange={(checked) => {
                            if (readOnly) return
                            const enabled = checked ?? false
                            handleCellChange(rowIndex, column, enabled)
                            if (enabled && column.conditionalFields?.length) {
                              setQuantityDialog({ rowIndex, column })
                            }
                          }}
                        />
                        {!readOnly && Boolean(value) && column.conditionalFields?.length ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-5 w-5 p-0 text-xs"
                            aria-label={`Edit ${column.label.toLowerCase()} quantities`}
                            title={`Edit ${column.label.toLowerCase()} quantities`}
                            onClick={() => setQuantityDialog({ rowIndex, column })}
                          >
                            🖊️
                          </Button>
                        ) : null}
                      </div>
                    ) : isSn && !isSnEditable ? (
                      <div
                        className="cursor-pointer px-2 py-1 text-sm text-muted-foreground"
                        onDoubleClick={() => {
                          setSnEditableRows((prev) => ({
                            ...prev,
                            [rowIndex]: true,
                          }))
                        }}
                      >
                        {rowIndex + 1}
                      </div>
                    ) : (
                      <div className={`relative mx-auto space-y-1 ${fixedLayout && column.key === "productName" ? "w-full max-w-sm" : ""}`}>
                        {column.previousValueKey && row[column.previousValueKey] !== undefined && row[column.previousValueKey] !== "" && ((!column.autoValueKey || Number(row[column.previousValueKey]) !== Number(row[column.autoValueKey])) || Boolean(column.previousValueToggleKey)) ? (
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 cursor-pointer select-none py-0.5">
                            <Checkbox
                              checked={column.previousValueToggleKey ? Boolean(row[column.previousValueToggleKey]) : Number(value) === Number(row[column.previousValueKey])}
                              disabled={readOnly}
                              onCheckedChange={(checked) => {
                                if (readOnly) return
                                if (column.previousValueToggleKey) {
                                  const updatedRows = [...activeRows]
                                  updatedRows[rowIndex] = { ...updatedRows[rowIndex], [column.previousValueToggleKey]: Boolean(checked) }
                                  updateRows(updatedRows)
                                  return
                                }
                                handleCellChange(rowIndex, column, checked ? String(row[column.previousValueKey]) : String(row[column.autoValueKey] ?? ""))
                              }}
                            />
                            <span>Prev: ₦{Number(row[column.previousValueKey]).toLocaleString()}</span>
                          </label>
                        ) : null}
                        <Input
                          id={`cell-${rowIndex}-${column.key}`}
                          type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
                          className={column.type === "number" ? "max-w-[120px]" : undefined}
                          value={displayValue}
                          placeholder={column.label}
                          onFocus={() => {
                            if (column.type === "text" && displayValue.length >= 3) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            }
                          }}
                          onChange={(event) => {
                            handleCellChange(rowIndex, column, event.target.value)
                            if (column.type === "text" && event.target.value.length >= 3) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            } else {
                              setActiveSuggestion(null)
                            }
                          }}
                          readOnly={readOnly || column.readOnly}
                          onBlur={() => {
                            if (isSn) {
                              setSnEditableRows((prev) => ({
                                ...prev,
                                [rowIndex]: false,
                              }))
                            }
                            window.setTimeout(() => setActiveSuggestion(null), 150)
                          }}
                        />
                        {isCurrentSuggestionActive && filteredSuggestions.length > 0 ? (
                          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            {filteredSuggestions.map((item) => {
                              const label = typeof item === "string" ? item : item.label
                              const value = typeof item === "string" ? item : item.value
                              const onAction = typeof item === "string" ? undefined : item.onAction
                              const actionLabel = typeof item === "string" ? undefined : item.actionLabel
                              return <div key={value} className="flex items-center gap-1 rounded pr-1 hover:bg-accent">
                                <button
                                  type="button"
                                  className="min-w-0 flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    handleCellChange(rowIndex, column, value)
                                    setActiveSuggestion(null)
                                  }}
                                >
                                  {label}
                                </button>
                                {onAction ? <button
                                  type="button"
                                  aria-label={actionLabel ?? `Merge ${value}`}
                                  title={actionLabel ?? `Merge ${value}`}
                                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-amber-600 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    setActiveSuggestion(null)
                                    onAction()
                                  }}
                                ><GitMerge className="h-4 w-4" /></button> : null}
                              </div>
                            })}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
            {isGroupEnd ? <TableRow className="border-b border-background border-2 bg-muted/30">
              {columns.map((column) => (
                <TableCell key={column.key} className="font-semibold justify-center items-center text-center">
                  {column.key === "productName" ? groupTotalContent?.({ startIndex: groupStartIndex, endIndex: rowIndex, total: groupTotalForRows(groupStartIndex, rowIndex, "total") }) ?? "Customer total" : column.key === "total" ? groupTotalForRows(groupStartIndex, rowIndex, column.key) || "" : ""}
                </TableCell>
              ))}
            </TableRow> : null}
            </Fragment>
          })}
          {footerTotals ? (
            <TableRow className="border-b border-background border-2">
              {columns.map((column) => (
                <TableCell key={column.key} className="font-semibold justify-center items-center text-center">
                  {column.type === "number" ? footerTotals[column.key] : ""}
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      </div>
      {!readOnly && <div className="absolute bottom-2 right-2 z-20 flex items-center justify-end gap-2">
        {extraActions}
        <Button type="button" variant="secondary" onClick={addRow}>Add row</Button>
      </div>}
      <Dialog open={quantityDialog !== null} onOpenChange={(open) => !open && setQuantityDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set {quantityDialog?.column.label.toLowerCase()} quantities</DialogTitle>
            <DialogDescription>Enter the quantities for this row.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {quantityDialog?.column.conditionalFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`quantity-${quantityDialog.rowIndex}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`quantity-${quantityDialog.rowIndex}-${field.key}`}
                  type="number"
                  min="0"
                  value={String(activeRows[quantityDialog.rowIndex]?.[field.key] ?? "")}
                  onChange={(event) => handleCellChange(quantityDialog.rowIndex, { ...quantityDialog.column, key: field.key, type: "number" }, event.target.value)}
                />
              </div>
            ))}
            {quantityDialog ? (() => {
              const rowData = activeRows[quantityDialog.rowIndex] || {}
              const isCarton = quantityDialog.column.key === "carton"
              const isPack = quantityDialog.column.key === "pack"
              const pCount = Number(rowData.pcsCount) || 1

              if (isCarton) {
                const cQty = Number(rowData.cartonQty) || 0
                const ppc = Number(rowData.packsPerCarton) || 1
                const totalPcsFromCarton = cQty * ppc * pCount
                return (
                  <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/40 p-3">
                    <Label className="text-xs font-semibold text-muted-foreground">Total Pcs from Cartons (Read-only)</Label>
                    <div className="text-base font-bold text-foreground">{totalPcsFromCarton.toLocaleString()} Pcs</div>
                  </div>
                )
              }

              if (isPack) {
                const pkQty = Number(rowData.packQty) || 0
                const totalPcsFromPack = pkQty * pCount
                return (
                  <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/40 p-3">
                    <Label className="text-xs font-semibold text-muted-foreground">Total Pcs from Packs (Read-only)</Label>
                    <div className="text-base font-bold text-foreground">{totalPcsFromPack.toLocaleString()} Pcs</div>
                  </div>
                )
              }

              return null
            })() : null}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setQuantityDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}

export default Tables
