import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type DailyTotals = {
  date: string
  customers: number
  revenue: number
  grossProfit: number
  expenses: number
  netProfit: number
}

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)

/** Total pieces from any stock or sale row */
const pcsOf = (row: {
  totalPcs?: number | null
  qty?: number | null
  pcsQty?: number | null
  packQty?: number | null
  pcsCount?: number | null
  cartonQty?: number | null
  packsPerCarton?: number | null
}) =>
  row.totalPcs ??
  row.qty ??
  (row.cartonQty ?? 0) * (row.packsPerCarton ?? 1) * (row.pcsCount ?? 1) +
    (row.packQty ?? 0) * (row.pcsCount ?? 1) +
    (row.pcsQty ?? 0)

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const fromValue = params.get("from")
  const toValue = params.get("to")
  if (
    !fromValue ||
    !toValue ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fromValue) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(toValue)
  ) {
    return NextResponse.json({ error: "Provide valid from and to dates." }, { status: 400 })
  }

  const from = new Date(`${fromValue}T00:00:00.000Z`)
  const to = new Date(`${toValue}T23:59:59.999Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return NextResponse.json({ error: "The date range is invalid." }, { status: 400 })
  }

  // Buffer ±1 day to handle timezone edge-cases
  const bufferedFrom = new Date(from.getTime() - 24 * 60 * 60 * 1000)
  const bufferedTo = new Date(to.getTime() + 24 * 60 * 60 * 1000)

  try {
    // 1. Sales in date range
    const salesInventories = await prisma.inventory.findMany({
      where: {
        type: "sale",
        date: { gte: bufferedFrom, lte: bufferedTo },
      },
      select: {
        id: true,
        date: true,
        sales: {
          select: {
            customerSn: true,
            customerName: true,
            productName: true,
            total: true,
            price: true,
            qty: true,
            costPrice: true,
            totalPcs: true,
            pcsQty: true,
            packQty: true,
            pcsCount: true,
            cartonQty: true,
            packsPerCarton: true,
          },
        },
      },
    })

    // 2. All stock entries used to build date-aware cost-per-piece history
    const allStockInventories = await prisma.inventory.findMany({
      where: { type: "stock" },
      select: {
        date: true,
        createdAt: true,
        stocks: {
          select: {
            productName: true,
            costPrice: true,
            pcsCostPrice: true,
            packCostPrice: true,
            cartonCostPrice: true,
            totalPcs: true,
            qty: true,
            pcsQty: true,
            packQty: true,
            pcsCount: true,
            cartonQty: true,
            packsPerCarton: true,
          },
        },
      },
      orderBy: { date: "asc" },
    })

    // 3. All inventories for on-hand stock chart
    const allInventoriesForStock = await prisma.inventory.findMany({
      where: { type: { in: ["sale", "stock"] } },
      select: {
        type: true,
        stocks: {
          select: {
            productName: true,
            totalPcs: true,
            cartonQty: true,
            packsPerCarton: true,
            packQty: true,
            pcsCount: true,
            pcsQty: true,
          },
        },
        sales: {
          select: {
            productName: true,
            totalPcs: true,
            qty: true,
            pcsQty: true,
            packQty: true,
            pcsCount: true,
            cartonQty: true,
            packsPerCarton: true,
          },
        },
      },
    })

    // 4. Expenses in date range (including span expenses)
    const expensesInRange = await prisma.expense.findMany({
      where: {
        OR: [
          { date: { gte: bufferedFrom, lte: bufferedTo } },
          {
            items: {
              some: {
                span: true,
                spanFrom: { lte: bufferedTo },
                spanTo: { gte: bufferedFrom },
              },
            },
          },
        ],
      },
      select: {
        date: true,
        total: true,
        items: {
          select: {
            amount: true,
            span: true,
            spanFrom: true,
            spanTo: true,
          },
        },
      },
    })

    // 5. Build date-aware cost-per-piece histories from stock entries.
    const productCostHistory = new Map<string, Array<{ date: string; costPerPiece: number }>>()
    for (const inv of allStockInventories) {
      for (const stock of inv.stocks) {
        const key = stock.productName.trim().toLowerCase()
        if (!key) continue

        let costPerPiece: number | null = null
        if (stock.pcsCostPrice != null && stock.pcsCostPrice > 0) {
          costPerPiece = stock.pcsCostPrice
        } else if (stock.costPrice != null && stock.costPrice > 0) {
          const batchPcs = pcsOf(stock)
          if (batchPcs > 0) costPerPiece = stock.costPrice / batchPcs
        }

        if (costPerPiece != null) {
          const history = productCostHistory.get(key) ?? []
          history.push({ date: dayKey(inv.date ?? inv.createdAt), costPerPiece })
          productCostHistory.set(key, history)
        }
      }
    }
    productCostHistory.forEach((history) => history.sort((a, b) => a.date.localeCompare(b.date)))

    // 6. Initialise daily map
    const days = new Map<string, DailyTotals>()
    const customerSets = new Map<string, Set<string>>()
    const dayCursor = new Date(`${fromValue}T00:00:00.000Z`)
    const endCursor = new Date(`${toValue}T00:00:00.000Z`)
    while (dayCursor <= endCursor) {
      const date = dayCursor.toISOString().slice(0, 10)
      days.set(date, { date, customers: 0, revenue: 0, grossProfit: 0, expenses: 0, netProfit: 0 })
      customerSets.set(date, new Set())
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1)
    }

    // 7. Accumulate revenue + COGS per day
    for (const inventory of salesInventories) {
      if (!inventory.date) continue
      const date = dayKey(inventory.date)
      const totals = days.get(date)
      const customers = customerSets.get(date)
      if (!totals || !customers) continue

      // Track unique customers
      const customer = inventory.sales.find(
        (sale) => sale.customerSn != null || sale.customerName?.trim(),
      )
      customers.add(
        customer?.customerSn != null
          ? `sn:${customer.customerSn}`
          : customer?.customerName?.trim()
            ? `name:${customer.customerName.trim().toLowerCase()}`
            : inventory.id,
      )

      for (const sale of inventory.sales) {
        // Revenue: use stored total; fallback to price × soldPcs
        const soldPcs = pcsOf(sale)
        const revenue = sale.total ?? (sale.price ?? 0) * ((soldPcs || sale.qty) ?? 1)
        totals.revenue += revenue

        // InventorySale.costPrice may contain the stock batch's total cost, not
        // a unit cost. Use the latest stock cost-per-piece on or before the sale.
        let cogs = 0
        if (soldPcs > 0) {
          const key = sale.productName.trim().toLowerCase()
          const history = productCostHistory.get(key) ?? []
          const saleCost = [...history].reverse().find((entry) => entry.date <= date)
          if (saleCost) cogs = saleCost.costPerPiece * soldPcs
        }

        totals.grossProfit += revenue - cogs
      }
    }

    // Propagate customer counts
    customerSets.forEach((set, date) => {
      const totals = days.get(date)
      if (totals) totals.customers = set.size
    })

    // 8. Distribute shared expenses across every date in their span.
    for (const expense of expensesInRange) {
      if (expense.items.length > 0) {
        for (const item of expense.items) {
          if (item.span && item.spanFrom && item.spanTo) {
            const firstSpanDay = dayKey(item.spanFrom)
            const lastSpanDay = dayKey(item.spanTo)
            const spanDays = Math.max(1, Math.round(
              (Date.parse(`${lastSpanDay}T00:00:00Z`) - Date.parse(`${firstSpanDay}T00:00:00Z`)) / 86_400_000,
            ) + 1)
            const rangeStart = firstSpanDay < fromValue ? fromValue : firstSpanDay
            const rangeEnd = lastSpanDay > toValue ? toValue : lastSpanDay
            for (let cursor = new Date(`${rangeStart}T00:00:00Z`); cursor <= new Date(`${rangeEnd}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
              const totals = days.get(cursor.toISOString().slice(0, 10))
              if (totals) totals.expenses += item.amount / spanDays
            }
          } else {
            const totals = days.get(dayKey(expense.date))
            if (totals) totals.expenses += item.amount
          }
        }
      } else {
        const totals = days.get(dayKey(expense.date))
        if (totals) totals.expenses += expense.total
      }
    }

    // 9. Net profit = gross profit − expenses
    days.forEach((totals) => {
      totals.netProfit = totals.grossProfit - totals.expenses
    })

    // 10. On-hand stock by product (for bar chart)
    const stockByProduct = new Map<string, { name: string; quantity: number }>()
    for (const inventory of allInventoriesForStock) {
      if (inventory.type === "stock") {
        for (const stock of inventory.stocks) {
          const key = stock.productName.trim().toLowerCase()
          if (!key) continue
          const current = stockByProduct.get(key) ?? { name: stock.productName.trim(), quantity: 0 }
          current.quantity += pcsOf(stock)
          stockByProduct.set(key, current)
        }
      } else {
        for (const sale of inventory.sales) {
          const key = sale.productName.trim().toLowerCase()
          if (!key) continue
          const current = stockByProduct.get(key) ?? { name: sale.productName.trim(), quantity: 0 }
          current.quantity -= pcsOf(sale)
          stockByProduct.set(key, current)
        }
      }
    }

    const daily = Array.from(days.values())
    const stock = Array.from(stockByProduct.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 12)

    const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0)
    const totalGrossProfit = daily.reduce((s, d) => s + d.grossProfit, 0)
    const totalExpenses = daily.reduce((s, d) => s + d.expenses, 0)
    const totalNetProfit = daily.reduce((s, d) => s + d.netProfit, 0)

    return NextResponse.json({
      daily,
      stock,
      summary: {
        customers: daily.reduce((s, d) => s + d.customers, 0),
        revenue: totalRevenue,
        grossProfit: totalGrossProfit,
        expenses: totalExpenses,
        netProfit: totalNetProfit,
        // Legacy alias kept for any client that reads .profit
        profit: totalNetProfit,
        stockUnits: stock.reduce((s, p) => s + p.quantity, 0),
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (error) {
    console.error("Unable to load inventory analytics", error)
    return NextResponse.json({ error: "Unable to load inventory analytics." }, { status: 500 })
  }
}