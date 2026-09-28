const fs = require("node:fs")
const path = require("node:path")
require("dotenv").config()
const Papa = require("papaparse")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const csvPath = path.resolve(process.argv[2] || "sales_clean_numeric_dates-1.csv")
const PRICE_LIMIT = 0.30
const clean = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
const tokens = (value) => clean(value).split(" ").filter((part) => part.length >= 3)
const valueFrom = (row, names) => {
  const aliases = new Set(names.map(clean))
  const header = Object.keys(row).find((key) => aliases.has(clean(key)))
  return header ? String(row[header] ?? "").trim() : ""
}

function nameSimilarity(csvName, stockName) {
  const csvTokens = tokens(csvName)
  const stockTokens = tokens(stockName)
  if (!csvTokens.length || !stockTokens.length) return 0
  let score = 0
  for (const csvToken of csvTokens) {
    let longest = 0
    for (const stockToken of stockTokens) {
      for (let start = 0; start <= csvToken.length - 3; start += 1) {
        for (let length = csvToken.length - start; length >= Math.max(3, longest); length -= 1) {
          if (stockToken.includes(csvToken.slice(start, start + length))) {
            longest = length
            break
          }
        }
      }
    }
    if (longest >= 3) score += longest * longest
  }
  return score
}

function findProduct(csvName, unitPrice, products) {
  return products
    .map((product) => {
      const similarity = nameSimilarity(csvName, product.name)
      const bestPrice = product.prices
        .map((price) => ({ price, difference: Math.abs(price - unitPrice) / price }))
        .sort((a, b) => a.difference - b.difference)[0]
      return { ...product, similarity, difference: bestPrice?.difference ?? Infinity, comparedPrice: bestPrice?.price }
    })
    .filter((product) => product.similarity >= 9 && product.difference <= PRICE_LIMIT)
    .sort((a, b) => a.difference - b.difference || b.similarity - a.similarity)[0]
}

async function main() {
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`)
  if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is missing from the project environment")

  const parsed = Papa.parse(fs.readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: "greedy" })
  if (parsed.errors.length) throw new Error(parsed.errors[0].message)

  const stockRows = await prisma.inventoryStock.findMany({
    orderBy: { createdAt: "desc" },
    select: { productName: true, pcsSalesPrice: true, packSalesPrice: true, cartonSalesPrice: true },
  })
  const latestStock = new Map()
  for (const stock of stockRows) {
    const name = String(stock.productName ?? "").trim()
    const key = clean(name)
    if (!name || latestStock.has(key)) continue
    const prices = [stock.pcsSalesPrice, stock.packSalesPrice, stock.cartonSalesPrice]
      .map(Number).filter((price) => Number.isFinite(price) && price > 0)
    latestStock.set(key, { name, prices })
  }
  const products = [...latestStock.values()]

  const groups = new Map()
  const unmatched = []
  let skippedDiscounts = 0
  let skippedDailyTotals = 0

  parsed.data.forEach((row, index) => {
    const entryType = valueFrom(row, ["entry type"]).toLowerCase()
    if (entryType === "discount") { skippedDiscounts += 1; return }
    if (entryType.includes("recorded daily total")) { skippedDailyTotals += 1; return }

    const date = valueFrom(row, ["date"])
    const customerSn = Number(valueFrom(row, ["customer / s/n", "customer/s/n", "s/n", "customer sn"]))
    const csvName = valueFrom(row, ["item description", "product name", "product"])
    const quantity = Number(valueFrom(row, ["quantity", "qty"]))
    const amount = Number(valueFrom(row, ["amount (ngn)", "amount", "total"]).replace(/[,₦\s]/g, ""))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(customerSn) || !csvName || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(amount)) {
      unmatched.push({ csvRow: index + 2, date, customerSn, product: csvName, reason: "Invalid CSV fields" })
      return
    }

    const unitPrice = amount / quantity
    const product = findProduct(csvName, unitPrice, products)
    if (!product) {
      unmatched.push({ csvRow: index + 2, date, customerSn, product: csvName, qty: quantity, amount, reason: "No product-name candidate within 30% of saved price" })
      return
    }

    const key = `${date}|${customerSn}`
    if (!groups.has(key)) groups.set(key, { date, customerSn, rows: [] })
    groups.get(key).rows.push({ productName: product.name, quantity, unitPrice, amount })
  })

  // Don't duplicate a date/customer order if this script is re-run.
  const dates = [...new Set([...groups.values()].map((group) => group.date))].sort()
  const existing = dates.length ? await prisma.inventory.findMany({
    where: {
      type: "sale",
      date: { gte: new Date(`${dates[0]}T00:00:00.000Z`), lte: new Date(`${dates.at(-1)}T23:59:59.999Z`) },
    },
    include: { sales: { select: { customerSn: true } } },
  }) : []
  const existingGroups = new Set()
  for (const inventory of existing) {
    if (!inventory.date) continue
    const date = inventory.date.toISOString().slice(0, 10)
    for (const sale of inventory.sales) if (sale.customerSn != null) existingGroups.add(`${date}|${sale.customerSn}`)
  }

  const pendingGroups = [...groups.entries()].filter(([key]) => !existingGroups.has(key))
  const duplicateGroups = groups.size - pendingGroups.length
  const totalGroupsToSave = pendingGroups.length
  let savedGroups = 0
  let savedLines = 0
  for (const [key, group] of pendingGroups) {
    await prisma.inventory.create({
      data: {
        type: "sale",
        date: new Date(`${group.date}T00:00:00.000Z`),
        sales: { create: group.rows.map((row, index) => ({
          sn: index + 1,
          customerSn: group.customerSn,
          productName: row.productName,
          carton: false,
          pack: false,
          pcsQty: row.quantity,
          totalPcs: row.quantity,
          pcsSalesPrice: row.unitPrice,
          price: row.unitPrice,
          total: row.amount,
          wholesale: false,
        })) },
      },
    })
    existingGroups.add(key)
    savedGroups += 1
    savedLines += group.rows.length
    console.log(`${savedGroups}/${totalGroupsToSave} sales orders successfully saved — ${group.date}, customer S/N ${group.customerSn}, ${group.rows.length} product line(s).`)
  }

  console.log(JSON.stringify({
    csv: csvPath,
    savedLines,
    savedCustomerOrders: savedGroups,
    dates: dates.length,
    unmatchedLines: unmatched.length,
    skippedDiscounts,
    skippedDailyTotals,
    skippedExistingOrders: duplicateGroups,
    unmatchedExamples: unmatched.slice(0, 25),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
