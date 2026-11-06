"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type CellValue = string | number | boolean
export type InventoryRow = Record<string, CellValue>
export type InventoryColumn = { key: string; label: string; type: "text" | "number" | "boolean" }
type Props = { columns: InventoryColumn[]; rows: InventoryRow[]; products: string[]; onRowsChange: (rows: InventoryRow[]) => void }

export function InventoryTable({ columns, rows, products, onRowsChange }: Props) {
  const [editableSerial, setEditableSerial] = useState<Record<number, boolean>>({})
  const update = (index: number, column: InventoryColumn, value: string | boolean) => onRowsChange(rows.map((row, rowIndex): InventoryRow => rowIndex === index ? { ...row, [column.key]: column.type === "number" && value !== "" ? Number(value) : value } : row))
  return <div className="table-wrap"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, rowIndex) => <TableRow key={rowIndex}>{columns.map((column) => {
    const value = row[column.key]
    if (column.type === "boolean") return <TableCell key={column.key}><Input type="checkbox" checked={Boolean(value)} onChange={(event) => update(rowIndex, column, event.target.checked)} /></TableCell>
    if (column.key === "sn" && !editableSerial[rowIndex]) return <TableCell key={column.key}><span className="serial" onDoubleClick={() => setEditableSerial((current) => ({ ...current, [rowIndex]: true }))}>{value || rowIndex + 1}</span></TableCell>
    const listId = column.key === "productName" ? `products-${rowIndex}` : undefined
    return <TableCell key={column.key}><Input type={column.type} list={listId} value={value === undefined ? "" : String(value)} readOnly={["sn", "totalPcs", "total"].includes(column.key)} onBlur={() => column.key === "sn" && setEditableSerial((current) => ({ ...current, [rowIndex]: false }))} onChange={(event) => update(rowIndex, column, event.target.value)} />{listId && <datalist id={listId}>{products.map((product) => <option key={product} value={product} />)}</datalist>}</TableCell>
  })}</TableRow>)}</TableBody></Table><div className="table-footer"><span>{rows.length} lines ready</span><Button variant="secondary" onClick={() => onRowsChange([...rows, Object.fromEntries(columns.map((column) => [column.key, column.type === "boolean" ? false : ""]))])}>+ Add row</Button></div></div>
}