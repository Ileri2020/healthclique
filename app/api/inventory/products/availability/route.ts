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
          pcsQty: true,
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
      if (packsPerCarton > 1) balance.packsPerCarton = packsPerCarton
      if (piecesPerPack > 1) balance.piecesPerPack = piecesPerPack
      const derivedPieces = (stock.cartonQty || 0) * packsPerCarton * piecesPerPack + (stock.packQty || 0) * piecesPerPack + (stock.pcsQty || 0)
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
      .map((balance) => {
        const totalAvail = Math.max(balance.availablePieces, 0)
        const pcsPerCarton = balance.packsPerCarton > 1 && balance.piecesPerPack > 0
          ? balance.packsPerCarton * balance.piecesPerPack
          : 0

        const cartons = pcsPerCarton > 0 ? Math.floor(totalAvail / pcsPerCarton) : 0
        const remAfterCartons = pcsPerCarton > 0 ? totalAvail % pcsPerCarton : totalAvail

        const packs = balance.piecesPerPack > 1 ? Math.floor(remAfterCartons / balance.piecesPerPack) : 0
        const pieces = balance.piecesPerPack > 1 ? remAfterCartons % balance.piecesPerPack : remAfterCartons

        return {
          ...balance,
          availablePieces: totalAvail,
          cartons,
          packs,
          pieces,
        }
      })
      .sort((left, right) => left.productName.localeCompare(right.productName)))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load product availability" }, { status: 500 })
  }
}
