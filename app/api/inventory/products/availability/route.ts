import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ProductBalance = {
  productName: string
  availablePieces: number
  cartons: number
  packs: number
  pieces: number
  packsPerCarton: number
  piecesPerPack: number
  conversionSet: boolean
}

export async function GET() {
  try {
    const [stocks, sales] = await Promise.all([
      prisma.inventoryStock.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          productName: true,
          cartonQty: true,
          packsPerCarton: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          totalPcs: true,
        },
      }),
      prisma.inventorySale.findMany({
        select: {
          productName: true,
          cartonQty: true,
          packsPerCarton: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          totalPcs: true,
        },
      }),
    ])

    const balances = new Map<string, ProductBalance>()
    const getBalance = (productName: string) => {
      const existing = balances.get(productName)
      if (existing) return existing
      const balance: ProductBalance = {
        productName,
        availablePieces: 0,
        cartons: 0,
        packs: 0,
        pieces: 0,
        packsPerCarton: 1,
        piecesPerPack: 1,
        conversionSet: false,
      }
      balances.set(productName, balance)
      return balance
    }

    stocks.forEach((stock) => {
      const productName = stock.productName.trim()
      if (!productName) return
      const balance = getBalance(productName)
      const packsPerCarton = stock.packsPerCarton || 1
      const piecesPerPack = stock.pcsCount || 1
      if (!balance.conversionSet) {
        balance.packsPerCarton = packsPerCarton
        balance.piecesPerPack = piecesPerPack
        balance.conversionSet = true
      }
      const cartonQty = stock.cartonQty || 0
      const packQty = stock.packQty || 0
      const piecesQty = stock.pcsQty ?? (cartonQty === 0 && packQty === 0 ? (stock.totalPcs || 0) : 0)
      const derivedPieces = cartonQty * packsPerCarton * piecesPerPack + packQty * piecesPerPack + piecesQty
      balance.availablePieces += derivedPieces
      balance.cartons += cartonQty
      balance.packs += packQty
      balance.pieces += piecesQty
    })

    sales.forEach((sale) => {
      const productName = sale.productName.trim()
      if (!productName) return
      const balance = getBalance(productName)
      const piecesPerPack = sale.pcsCount || balance.piecesPerPack || 1
      const cartonQty = sale.cartonQty || 0
      const packQty = sale.packQty || 0
      const piecesQty = sale.pcsQty ?? (cartonQty === 0 && packQty === 0 ? (sale.totalPcs || 0) : 0)
      const soldPieces = cartonQty * (sale.packsPerCarton || balance.packsPerCarton || 1) * piecesPerPack
        + packQty * piecesPerPack
        + piecesQty
      balance.availablePieces -= soldPieces
      balance.cartons -= cartonQty
      balance.packs -= packQty
      balance.pieces -= piecesQty
    })

    return NextResponse.json([...balances.values()]
      .map((balance) => ({
        ...balance,
        availablePieces: Math.max(balance.availablePieces, 0),
        cartons: Math.max(balance.cartons, 0),
        packs: Math.max(balance.packs, 0),
        pieces: Math.max(balance.pieces, 0),
      }))
      .sort((left, right) => left.productName.localeCompare(right.productName)))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load product availability" }, { status: 500 })
  }
}
