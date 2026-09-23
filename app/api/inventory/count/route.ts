import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getCountProducts } from "@/lib/stock-counts"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const countId = url.searchParams.get("id")
    if (countId) {
      const count = await prisma.stockCount.findUnique({ where: { id: countId }, include: { lines: true, shelf: true } })
      if (!count) return NextResponse.json({ error: "Stock count not found" }, { status: 404 })
      return NextResponse.json(count)
    }
    const requestedDate = url.searchParams.get("date")
    const asOfDate = requestedDate ? new Date(requestedDate) : undefined
    const calculatedProducts = await getCountProducts(asOfDate)
    const shelves = await prisma.shelf.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json({
      products: calculatedProducts.map((product) => ({
        productName: product.productName,
        availablePieces: product.expectedPcs,
        shortestExpiry: product.expiry,
        shelfId: null,
        shelfName: product.shelfName,
        packsPerCarton: product.packsPerCarton,
        piecesPerPack: product.pcsCount,
        cartonEnabled: product.cartonEnabled,
        packEnabled: product.packEnabled,
        pcsSalesPrice: product.salesPrice,
        packSalesPrice: product.salesPrice,
        cartonSalesPrice: product.salesPrice,
      })),
      shelves,
    })
    /*
    const [stocks, sales, productShelves, shelves] = await Promise.all([
      prisma.inventoryStock.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          carton: true,
          cartonQty: true,
          packsPerCarton: true,
          pack: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          totalPcs: true,
          pcsSalesPrice: true,
          packSalesPrice: true,
          cartonSalesPrice: true,
          wholesalePcsSalesPrice: true,
          wholesalePackSalesPrice: true,
          wholesaleCartonSalesPrice: true,
          expiry: true,
          createdAt: true,
        },
      }),
      prisma.inventorySale.findMany({
        orderBy: { createdAt: "asc" },
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
      prisma.productShelf.findMany(),
      prisma.shelf.findMany({ orderBy: { name: "asc" } }),
    ])

    const shelfMap = new Map<string, { shelfId?: string; shelfName?: string }>()
    productShelves.forEach((ps) => {
      shelfMap.set(ps.productName.toLowerCase(), {
        shelfId: ps.shelfId ?? undefined,
        shelfName: ps.shelfName ?? undefined,
      })
    })

    // Group stocks by product name
    const productStocksMap = new Map<string, typeof stocks>()
    stocks.forEach((s) => {
      const name = s.productName?.trim()
      if (!name) return
      const list = productStocksMap.get(name) || []
      list.push(s)
      productStocksMap.set(name, list)
    })

    // Group sales by product name
    const productSalesMap = new Map<string, number>()
    sales.forEach((s) => {
      const name = s.productName?.trim()
      if (!name) return
      const ppc = s.packsPerCarton || 1
      const pCount = s.pcsCount || 1
      const cQty = s.cartonQty || 0
      const pkQty = s.packQty || 0
      const pcsQty = s.pcsQty ?? (cQty === 0 && pkQty === 0 ? (s.totalPcs || 0) : 0)

      let soldPieces = 0
      if (cQty > 0) soldPieces += cQty * ppc * pCount
      if (pkQty > 0) soldPieces += pkQty * pCount
      soldPieces += pcsQty

      if (soldPieces === 0 && (s.totalPcs || 0) > 0) soldPieces = s.totalPcs || 0

      const currentTotal = productSalesMap.get(name) || 0
      productSalesMap.set(name, currentTotal + soldPieces)
    })

    const products = Array.from(productStocksMap.entries()).map(([productName, stockList]) => {
      const totalSoldPieces = productSalesMap.get(productName) || 0

      let remainingSoldToDeduct = totalSoldPieces
      let shortestExpiry: Date | null = null
      let netAvailablePieces = 0

      let packsPerCarton = 0
      let piecesPerPack = 0
      let cartonEnabled = false
      let packEnabled = false

      let pcsSalesPrice: number | undefined = undefined
      let packSalesPrice: number | undefined = undefined
      let cartonSalesPrice: number | undefined = undefined

      stockList.forEach((st) => {
        if (st.carton || (st.packsPerCarton || 0) > 0) cartonEnabled = true
        if (st.pack || (st.pcsCount || 0) > 0) packEnabled = true
        if ((st.packsPerCarton || 0) > 0 && !packsPerCarton) packsPerCarton = st.packsPerCarton!
        if ((st.pcsCount || 0) > 0 && !piecesPerPack) piecesPerPack = st.pcsCount!

        if (st.pcsSalesPrice) pcsSalesPrice = st.pcsSalesPrice
        if (st.packSalesPrice) packSalesPrice = st.packSalesPrice
        if (st.cartonSalesPrice) cartonSalesPrice = st.cartonSalesPrice

        const ppc = st.packsPerCarton || packsPerCarton || 1
        const pCount = st.pcsCount || piecesPerPack || 1
        const cQty = st.cartonQty || 0
        const pkQty = st.packQty || 0
        const pcQty = st.pcsQty ?? (cQty === 0 && pkQty === 0 ? (st.totalPcs || 0) : 0)

        let batchPieces = 0
        if (cQty > 0) batchPieces += cQty * ppc * pCount
        if (pkQty > 0) batchPieces += pkQty * pCount
        batchPieces += pcQty
        if (batchPieces === 0 && (st.totalPcs || 0) > 0) batchPieces = st.totalPcs || 0

        netAvailablePieces += batchPieces

        // FIFO stock depletion logic: check if this batch is still active
        if (remainingSoldToDeduct >= batchPieces) {
          remainingSoldToDeduct -= batchPieces
        } else {
          // Batch has active remaining stock!
          remainingSoldToDeduct = 0
          if (st.expiry) {
            if (!shortestExpiry || new Date(st.expiry) < shortestExpiry) {
              shortestExpiry = new Date(st.expiry)
            }
          }
        }
      })

      netAvailablePieces = Math.max(netAvailablePieces - totalSoldPieces, 0)

      const psInfo = shelfMap.get(productName.toLowerCase())

      return {
        productName,
        availablePieces: netAvailablePieces,
        shortestExpiry: shortestExpiry ? (shortestExpiry as Date).toISOString() : null,
        shelfId: psInfo?.shelfId ?? null,
        shelfName: psInfo?.shelfName ?? null,
        packsPerCarton,
        piecesPerPack,
        cartonEnabled,
        packEnabled,
        pcsSalesPrice,
        packSalesPrice,
        cartonSalesPrice,
      }
    }).sort((a, b) => a.productName.localeCompare(b.productName))

    return NextResponse.json({ products, shelves })
    */
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load count data" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    const body = await req.json()
    const id = String(body.id || "")
    if (!id || !Array.isArray(body.lines) || body.lines.length === 0) return NextResponse.json({ error: "Count id and lines are required" }, { status: 400 })
    const updated = await prisma.stockCount.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        shelfId: body.shelfId || undefined,
        shelfName: body.shelfName || undefined,
        lines: {
          deleteMany: {},
          create: body.lines.map((line: any) => ({
            productName: String(line.productName || ""),
            shelfName: line.shelfName || undefined,
            expectedPcs: Number(line.expectedPcs) || 0,
            countedPcs: line.countedPcs === "" || line.countedPcs == null ? null : Number(line.countedPcs),
            differencePcs: line.countedPcs === "" || line.countedPcs == null ? null : Number(line.countedPcs) - (Number(line.expectedPcs) || 0),
            expiry: line.expiry ? new Date(line.expiry) : null,
            packsPerCarton: line.packsPerCarton ? Number(line.packsPerCarton) : null,
            piecesPerPack: line.piecesPerPack ? Number(line.piecesPerPack) : null,
          })),
        },
      },
      include: { lines: true, shelf: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update stock count" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    const body = await req.json()
    const { date, shelfId, shelfName, note, lines } = body

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "No count lines provided" }, { status: 400 })
    }

    const countDate = date ? new Date(date) : new Date()

    // Persist product-shelf assignments
    await Promise.all(
      lines.map(async (line: any) => {
        const pName = line.productName?.trim()
        const sName = line.shelfName?.trim()
        if (pName && sName) {
          await prisma.productShelf.upsert({
            where: { productName: pName },
            update: { shelfName: sName, shelfId: line.shelfId || undefined },
            create: { productName: pName, shelfName: sName, shelfId: line.shelfId || undefined },
          }).catch(() => {})
        }
      })
    )

    const stockCount = await prisma.stockCount.create({
      data: {
        date: countDate,
        shelfId: shelfId || undefined,
        shelfName: shelfName || undefined,
        note: note ? String(note).trim() : undefined,
        lines: {
          create: lines.map((line: any) => ({
            productName: String(line.productName || ""),
            shelfName: line.shelfName ? String(line.shelfName) : undefined,
            expectedPcs: Number(line.expectedPcs) || 0,
            countedPcs: line.countedPcs !== "" && line.countedPcs !== undefined && line.countedPcs !== null ? Number(line.countedPcs) : null,
            differencePcs: line.countedPcs !== "" && line.countedPcs !== undefined && line.countedPcs !== null
              ? Number(line.countedPcs) - (Number(line.expectedPcs) || 0)
              : null,
            expiry: line.expiry ? new Date(line.expiry) : null,
            packsPerCarton: line.packsPerCarton ? Number(line.packsPerCarton) : null,
            piecesPerPack: line.piecesPerPack ? Number(line.piecesPerPack) : null,
          })),
        },
      },
      include: { lines: true },
    })

    return NextResponse.json(stockCount)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save stock count" }, { status: 500 })
  }
}
