import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role?.trim().toLowerCase()
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })
    }

    const body = await req.json()
    const productName = String(body.productName || "").trim()
    const shelfId = String(body.shelfId || "").trim()

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }
    if (!shelfId) {
      return NextResponse.json({ error: "Shelf is required" }, { status: 400 })
    }

    const shelf = await prisma.shelf.findUnique({ where: { id: shelfId } })
    if (!shelf) {
      return NextResponse.json({ error: "Shelf not found" }, { status: 404 })
    }

    const assignment = await prisma.productShelf.upsert({
      where: { productName },
      update: {
        shelfId: shelf.id,
        shelfName: shelf.name,
      },
      create: {
        productName,
        shelfId: shelf.id,
        shelfName: shelf.name,
      },
    })

    return NextResponse.json({ assignment, shelf })
  } catch (error) {
    console.error("product shelf assignment failed", error)
    return NextResponse.json({ error: "Unable to assign product to shelf" }, { status: 500 })
  }
}
