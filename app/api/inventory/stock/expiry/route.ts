import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { productName, expiry } = body

    const name = typeof productName === "string" ? productName.trim() : ""
    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    const expiryDate = expiry ? new Date(expiry) : null

    // Update expiry date on the most recent InventoryStock records for this product
    const latestStock = await prisma.inventoryStock.findFirst({
      where: { productName: name },
      orderBy: { createdAt: "desc" },
    })

    if (!latestStock) {
      return NextResponse.json({ error: "No stock record found for product" }, { status: 404 })
    }

    await prisma.inventoryStock.update({
      where: { id: latestStock.id },
      data: { expiry: expiryDate },
    })

    return NextResponse.json({ success: true, productName: name, expiry: expiryDate })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update stock expiry date" }, { status: 500 })
  }
}
