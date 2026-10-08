import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required to sync stock counts" }, { status: 403 })
    }

    const body = await request.json()
    const localSyncId = typeof body.localCountId === "string" ? body.localCountId : ""
    const dateText = typeof body.date === "string" ? body.date.slice(0, 10) : ""
    const lines = Array.isArray(body.lines) ? body.lines : []
    if (!localSyncId || !/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !lines.length) {
      return NextResponse.json({ error: "A local count ID, valid date, and at least one count line are required" }, { status: 400 })
    }

    const alreadySynced = await prisma.stockCount.findUnique({ where: { localSyncId }, select: { id: true } })
    if (alreadySynced) return NextResponse.json({ id: alreadySynced.id, alreadySynced: true })

    const shelfName = typeof body.shelfName === "string" ? body.shelfName.trim() : ""
    const shelfId = typeof body.shelfId === "string" && /^[a-f\d]{24}$/i.test(body.shelfId) ? body.shelfId : ""
    const shelf = shelfId
      ? await prisma.shelf.findUnique({ where: { id: shelfId } })
      : shelfName
      ? await prisma.shelf.findFirst({ where: { name: shelfName } })
      : null

    const cleanedLines = lines.map((line: any) => {
      const productName = typeof line.productName === "string" ? line.productName.trim() : ""
      if (!productName) throw new Error("Every stock count line must have a product name")
      const countedPcs = line.countedPcs === "" || line.countedPcs == null ? null : Number(line.countedPcs)
      if (countedPcs !== null && (!Number.isFinite(countedPcs) || countedPcs < 0)) {
        throw new Error(`Invalid counted quantity for ${productName}`)
      }
      return {
        productName,
        shelfName: typeof line.shelfName === "string" ? line.shelfName.trim() || undefined : undefined,
        expectedPcs: Number.isFinite(Number(line.expectedPcs)) ? Number(line.expectedPcs) : 0,
        countedPcs,
        differencePcs: countedPcs === null ? null : countedPcs - (Number(line.expectedPcs) || 0),
        expiry: line.expiry ? new Date(line.expiry) : null,
        packsPerCarton: line.packsPerCarton ? Number(line.packsPerCarton) : null,
        piecesPerPack: line.piecesPerPack ? Number(line.piecesPerPack) : null,
      }
    })

    const created = await prisma.stockCount.create({
      data: {
        localSyncId,
        staffName: String(body.staffName || session.user.name || "Local Staff").trim(),
        createdById: session.user.id,
        date: new Date(`${dateText}T00:00:00.000Z`),
        ...(shelf ? { shelf: { connect: { id: shelf.id } } } : {}),
        shelfName: shelf?.name || shelfName || undefined,
        lines: { create: cleanedLines },
      },
      select: { id: true },
    })

    await Promise.all(cleanedLines.filter((line) => line.shelfName).map((line) =>
      prisma.productShelf.upsert({
        where: { productName: line.productName },
        update: { shelfName: line.shelfName!, ...(shelf ? { shelfId: shelf.id } : {}) },
        create: { productName: line.productName, shelfName: line.shelfName!, ...(shelf ? { shelfId: shelf.id } : {}) },
      }).catch((error) => console.error("Unable to sync product shelf assignment", error)),
    ))

    return NextResponse.json({ id: created.id, alreadySynced: false })
  } catch (error) {
    console.error("Local stock count sync failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync local stock count" }, { status: 500 })
  }
}