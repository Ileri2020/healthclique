"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export type TableColumn = {
  key: string
  label: string
  type: "text" | "number" | "boolean"
  required?: boolean
  className?: string
  readOnly?: boolean
  conditionalFields?: {
    key: string
    label: string
  }[]
}

export type TableRow = Record<string, string | number | boolean | undefined>

interface TablesProps {
  columns: TableColumn[]
  defaultRowCount?: number
  rows?: TableRow[]
  onRowsChange?: (rows: TableRow[]) => void
  autocomplete?: Record<string, string[]>
  restrictToOptions?: string[]
  showTotals?: boolean
  minWidth?: string
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
  restrictToOptions = [],
  showTotals = false,
  minWidth = "1100px",
}: TablesProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<{ rowIndex: number; columnKey: string } | null>(null)
  const [internalRows, setInternalRows] = useState<TableRow[]>(
    () => Array.from({ length: defaultRowCount }, () => createBlankRow(columns))
  )

  const controlled = rows !== undefined
  const activeRows = controlled ? rows! : internalRows

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

    newRows[rowIndex] = row
    updateRows(newRows)
  }

  const handleCellBlur = (rowIndex: number, column: TableColumn) => {
    if (!restrictToOptions.includes(column.key)) {
      return
    }

    const value = activeRows[rowIndex]?.[column.key]
    const options = autocomplete?.[column.key] ?? []

    if (typeof value === "string" && value && !options.includes(value)) {
      handleCellChange(rowIndex, column, "")
    }
  }

  const [snEditableRows, setSnEditableRows] = useState<Record<number, boolean>>({})

  const addRow = () => {
    updateRows([...activeRows, createBlankRow(columns)])
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

  return (
    <div className="w-full max-w-full overflow-x-auto touch-pan-x scrollbar-thin">
      <div style={{ minWidth }}>
        <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className ?? ""}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => {
                const value = row[column.key]
                const suggestions = autocomplete?.[column.key] ?? []

                const isSn = column.key === "sn"
                const isSnEditable = Boolean(snEditableRows[rowIndex])
                const displayValue = isSn
                  ? String(value === undefined || value === "" ? rowIndex + 1 : value)
                  : value === undefined || value === null
                  ? ""
                  : String(value)

                return (
                  <TableCell key={column.key} className={`align-top py-2 ${column.className ?? ""}`}>
                    {column.type === "boolean" ? (
                      <div className="space-y-2">
                        <Checkbox
                          checked={Boolean(value)}
                          onCheckedChange={(checked) => handleCellChange(rowIndex, column, checked ?? false)}
                        />
                        {Boolean(value) && column.conditionalFields?.map((field) => (
                          <label key={field.key} className="block space-y-1">
                            <span className="text-[10px] text-muted-foreground">{field.label}</span>
                            <Input
                              type="number"
                              min="0"
                              className="h-8 w-full min-w-20 text-xs"
                              placeholder={field.label}
                              value={String(activeRows[rowIndex]?.[field.key] ?? "")}
                              onChange={(event) => handleCellChange(rowIndex, { ...column, key: field.key, type: "number" }, event.target.value)}
                            />
                          </label>
                        ))}
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
                      <div className="relative space-y-1">
                        <Input
                          type={column.type === "number" ? "number" : "text"}
                          value={displayValue}
                          placeholder={column.label}
                          onFocus={() => {
                            if (column.type === "text" && displayValue.length >= 4) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            }
                          }}
                          onChange={(event) => {
                            handleCellChange(rowIndex, column, event.target.value)
                            if (column.type === "text" && event.target.value.length >= 4) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            } else {
                              setActiveSuggestion(null)
                            }
                          }}
                          readOnly={column.readOnly}
                          onBlur={() => {
                            if (isSn) {
                              setSnEditableRows((prev) => ({
                                ...prev,
                                [rowIndex]: false,
                              }))
                            }
                            handleCellBlur(rowIndex, column)
                            window.setTimeout(() => setActiveSuggestion(null), 150)
                          }}
                        />
                        {activeSuggestion?.rowIndex === rowIndex && activeSuggestion.columnKey === column.key && displayValue.length >= 4 ? (
                          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            {suggestions.filter((item) => item.toLowerCase().includes(displayValue.toLowerCase())).slice(0, 12).map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleCellChange(rowIndex, column, item)
                                  setActiveSuggestion(null)
                                }}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {footerTotals ? (
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} className="font-semibold">
                  {column.type === "number" ? footerTotals[column.key] : ""}
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>
    </div>
  )
}

export default Tables
