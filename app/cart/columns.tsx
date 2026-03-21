"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Eye } from "lucide-react"
import { formatPrice } from "@/lib/stock-pricing"

export type CartSummary = {
    id: string
    name?: string
    total: number
    status: string
    createdAt: string
    _count: {
        products: number
    }
}

export const getColumns = (): ColumnDef<CartSummary>[] => [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name || "Main Cart"}</span>,
    },
    {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => {
            return <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(row.original.createdAt), "MMM d, yyyy")}
            </span>
        },
    },
    {
        accessorKey: "_count.products",
        header: "Items",
        cell: ({ row }) => <span className="text-center block">{row.original._count.products}</span>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status
            return (
                <Badge variant={status === "paid" || status === "completed" ? "default" : "secondary"} className="capitalize">
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total"))
            return <div className="text-right font-medium">₦{formatPrice(amount)}</div>
        },
    },
]
