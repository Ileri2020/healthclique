const fs = require("node:fs")
const path = require("node:path")
require("dotenv").config()
const Papa = require("papaparse")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const csvArgument = args.find((argument) => argument !== "--dry-run")
const csvPath = path.resolve(csvArgument || "sales_clean_numeric_dates-1.csv")
const PRICE_LIMIT = 0.30
const GENERIC_PRODUCT_WORDS = new Set([
  "amp", "ampoule", "amps", "bottle", "btl", "cap", "caps", "capsule", "carton",
  "cream", "dispersible", "drop", "drops", "exp", "expectorant", "injection", "inj",
  "mg", "ml", "pack", "packs", "pc", "pcs", "piece", "pieces", "pills", "pk",
  "solution", "sp", "susp", "suspension", "syrup", "tab", "tablet", "tablets", "tabs",
  "unit", "units", "years", "yr", "yrs",
])
const clean = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
const tokens = (value) => clean(value)
  .replace(/(\d)([a-z])/g, "$1 $2")
  .replace(/([a-z])(\d)/g, "$1 $2")
  .split(" ")
  .filter((part) => part.length >= 3 && !/^\d+$/.test(part) && !GENERIC_PRODUCT_WORDS.has(part))
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
  let hasStrongOverlap = false
  for (const csvToken of csvTokens) {
    let longest = 0
    let matchedStockTokenLength = 0
    for (const stockToken of stockTokens) {
      for (let start = 0; start <= csvToken.length - 3; start += 1) {
        for (let length = csvToken.length - start; length >= Math.max(3, longest); length -= 1) {
          if (stockToken.includes(csvToken.slice(start, start + length))) {
            longest = length
            matchedStockTokenLength = stockToken.length
            break
          }
        }
      }
    }
    const shorterTokenLength = Math.min(csvToken.length, matchedStockTokenLength)
    if (longest >= 4 && shorterTokenLength > 0 && longest / shorterTokenLength >= 0.65) {
      score += longest * longest
      hasStrongOverlap = true
    } else if (longest === 3 && stockTokens.includes(csvToken)) {
      score += 4
    }
  }
  return hasStrongOverlap ? score : 0
}

function findProduct(csvName, unitPrice, quantityType, products) {
  const type = clean(quantityType)
  const csvStrengths = [...clean(csvName).matchAll(/\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g)\b/g)]
    .map((match) => `${match[1]}${match[2]}`)
  const priceField = ["pk", "pack", "packs"].includes(type)
    ? "pack"
    : ["ct", "carton", "cartons"].includes(type)
      ? "carton"
      : type === "pcs" || type === "piece" || type === "pieces"
        ? "pcs"
        : null
  return products
    .map((product) => {
      const similarity = nameSimilarity(csvName, product.name)
      const productStrengths = [...clean(product.name).matchAll(/\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g)\b/g)]
        .map((match) => `${match[1]}${match[2]}`)
      const conflictingStrength = csvStrengths.length > 0 && productStrengths.length > 0 &&
        !csvStrengths.some((strength) => productStrengths.includes(strength))
      const prices = priceField ? product[`${priceField}Prices`] : product.prices
      const bestPrice = prices
        .map((price) => ({ price, difference: Math.abs(price - unitPrice) / price }))
        .sort((a, b) => a.difference - b.difference)[0]
      return { ...product, similarity: conflictingStrength ? 0 : similarity, difference: bestPrice?.difference ?? Infinity, comparedPrice: bestPrice?.price }
    })
    .filter((product) => product.similarity >= 16 && product.difference <= PRICE_LIMIT)
    .sort((a, b) => b.similarity - a.similarity || a.difference - b.difference)[0]
}

async function main() {
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`)
  if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is missing from the project environment")

  const parsed = Papa.parse(fs.readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: "greedy" })
  if (parsed.errors.length) throw new Error(parsed.errors[0].message)

  const stockRows = await prisma.inventoryStock.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      productName: true,
      pcsSalesPrice: true,
      packSalesPrice: true,
      cartonSalesPrice: true,
      pcsCount: true,
      packsPerCarton: true,
    },
  })
  const latestStock = new Map()
  for (const stock of stockRows) {
    const name = String(stock.productName ?? "").trim()
    const key = clean(name)
    if (!name || latestStock.has(key)) continue
    const validPrices = (values) => values.map(Number).filter((price) => Number.isFinite(price) && price > 0)
    const pcsPrices = validPrices([stock.pcsSalesPrice])
    const packPrices = validPrices([stock.packSalesPrice])
    const cartonPrices = validPrices([stock.cartonSalesPrice])
    latestStock.set(key, {
      name,
      prices: [...pcsPrices, ...packPrices, ...cartonPrices],
      pcsPrices,
      packPrices,
      cartonPrices,
      pcsCount: stock.pcsCount ?? 1,
      packsPerCarton: stock.packsPerCarton ?? 1,
    })
  }
  const products = [...latestStock.values()]

  const groups = new Map()
  const unmatched = []
  const matchedLines = []
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
    const quantityType = valueFrom(row, ["quantity type", "unit"])
    const amount = Number(valueFrom(row, ["amount (ngn)", "price ngn", "amount", "total"]).replace(/[,₦\s]/g, ""))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(customerSn) || customerSn <= 0 || !csvName || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(amount) || amount < 50 || quantity > 100) {
      unmatched.push({ csvRow: index + 2, date, customerSn, product: csvName, reason: "Invalid CSV fields" })
      return
    }

    const unitPrice = amount / quantity
    const product = findProduct(csvName, unitPrice, quantityType, products)
    if (!product) {
      unmatched.push({ csvRow: index + 2, date, customerSn, product: csvName, qty: quantity, amount, reason: "No product-name candidate within 30% of saved price" })
      return
    }

    const key = `${date}|${customerSn}`
    if (!groups.has(key)) groups.set(key, { date, customerSn, rows: [] })
    groups.get(key).rows.push({
      productName: product.name,
      quantity,
      unitPrice,
      amount,
      quantityType,
      pcsCount: product.pcsCount,
      packsPerCarton: product.packsPerCarton,
    })
    matchedLines.push({
      csvRow: index + 2,
      date,
      customerSn,
      sourceProduct: csvName,
      savedProduct: product.name,
      quantity,
      quantityType,
      amount,
      unitPrice,
    })
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

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run; no database writes made",
      csv: csvPath,
      candidateLines: [...groups.values()].reduce((sum, group) => sum + group.rows.length, 0),
      candidateCustomerOrders: groups.size,
      existingCustomerOrdersSkipped: duplicateGroups,
      newCustomerOrders: pendingGroups.length,
      dates: [...new Set([...groups.values()].map((group) => group.date))].sort(),
      matchedExamples: matchedLines.slice(0, 40),
      suspiciousMatches: matchedLines.filter((line) => line.unitPrice < 10 || line.quantity > 100 || line.amount < 50).slice(0, 80),
      unmatchedLines: unmatched.length,
      skippedDiscounts,
      skippedDailyTotals,
      unmatchedExamples: unmatched.slice(0, 40),
    }, null, 2))
    return
  }

  const totalGroupsToSave = pendingGroups.length
  let savedGroups = 0
  let savedLines = 0
  for (const [key, group] of pendingGroups) {
    await prisma.inventory.create({
      data: {
        type: "sale",
        date: new Date(`${group.date}T00:00:00.000Z`),
        sales: { create: group.rows.map((row, index) => {
          const type = clean(row.quantityType)
          const isPack = ["pk", "pack", "packs"].includes(type)
          const isCarton = ["ct", "carton", "cartons"].includes(type)
          const pcsCount = row.pcsCount || 1
          const packsPerCarton = row.packsPerCarton || 1
          const totalPcs = isCarton
            ? row.quantity * packsPerCarton * pcsCount
            : isPack
              ? row.quantity * pcsCount
              : row.quantity

          return {
            sn: index + 1,
            customerSn: group.customerSn,
            productName: row.productName,
            carton: isCarton,
            cartonQty: isCarton ? row.quantity : undefined,
            packsPerCarton: isCarton ? packsPerCarton : undefined,
            pack: isPack,
            packQty: isPack ? row.quantity : undefined,
            pcsCount: isPack || isCarton ? pcsCount : undefined,
            pcsQty: !isPack && !isCarton ? row.quantity : undefined,
            totalPcs,
            packSalesPrice: isPack ? row.unitPrice : undefined,
            pcsSalesPrice: !isPack && !isCarton ? row.unitPrice : undefined,
            price: row.unitPrice,
            total: row.amount,
            wholesale: false,
          }
        }) },
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
