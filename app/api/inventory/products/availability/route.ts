import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ProductBalance = {
  productName: string
  availablePieces: number
  packsPerCarton: number
  piecesPerPack: number
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
          pcsCount: true,
          totalPcs: true,
        },
      }),
      prisma.inventorySale.findMany({
        select: {
          productName: true,
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
        packsPerCarton: 1,
        piecesPerPack: 1,
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
      balance.packsPerCarton = packsPerCarton
      balance.piecesPerPack = piecesPerPack
      const derivedPieces = (stock.cartonQty || 0) * packsPerCarton * piecesPerPack + (stock.packQty || 0) * piecesPerPack
      balance.availablePieces += stock.totalPcs ?? derivedPieces
    })

    sales.forEach((sale) => {
      const productName = sale.productName.trim()
      if (!productName) return
      const balance = getBalance(productName)
      const piecesPerPack = sale.pcsCount || balance.piecesPerPack || 1
      const soldPieces = sale.totalPcs ?? ((sale.packQty || 0) * piecesPerPack + (sale.pcsQty || 0))
      balance.availablePieces -= soldPieces
    })

    return NextResponse.json([...balances.values()]
      .map((balance) => ({
        ...balance,
        availablePieces: Math.max(balance.availablePieces, 0),
        cartons: Math.floor(Math.max(balance.availablePieces, 0) / (balance.packsPerCarton * balance.piecesPerPack)),
        packs: Math.floor((Math.max(balance.availablePieces, 0) % (balance.packsPerCarton * balance.piecesPerPack)) / balance.piecesPerPack),
        pieces: Math.max(balance.availablePieces, 0) % balance.piecesPerPack,
      }))
      .sort((left, right) => left.productName.localeCompare(right.productName)))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load product availability" }, { status: 500 })
  }
}
