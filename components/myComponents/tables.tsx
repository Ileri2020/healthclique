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
}: TablesProps) {
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
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => {
                const value = row[column.key]
                const hasSuggestions = autocomplete?.[column.key]?.length
                const datalistId = `suggest-${column.key}-${rowIndex}`

                return (
                  <TableCell key={column.key} className="align-top py-2">
                    {column.type === "boolean" ? (
                      <div className="flex items-center">
                        <Checkbox
                          checked={Boolean(value)}
                          onCheckedChange={(checked) =>
                            handleCellChange(rowIndex, column, checked ?? false)
                          }
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          type={column.type === "number" ? "number" : "text"}
                          value={
                            value === undefined || value === null
                              ? ""
                              : String(value)
                          }
                          placeholder={column.label}
                          list={hasSuggestions ? datalistId : undefined}
                          onChange={(event) =>
                            handleCellChange(rowIndex, column, event.target.value)
                          }
                          onBlur={() => handleCellBlur(rowIndex, column)}
                        />
                        {hasSuggestions ? (
                          <datalist id={datalistId}>
                            {autocomplete![column.key].map((item) => (
                              <option key={item} value={item} />
                            ))}
                          </datalist>
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
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>
    </div>
  )
}

export default Tables
