import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { mergeInventoryProductNames } from "@/lib/merge-inventory-products"

export async function PATCH(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  try {
    const body = await request.json()
    const source = String(body.sourceProductName || "").trim()
    const target = String(body.targetProductName || "").trim()
    if (!source || !target || source.toLowerCase() === target.toLowerCase()) {
      return NextResponse.json({ error: "Two different product names are required" }, { status: 400 })
    }
    const result = await mergeInventoryProductNames(source, target)
    return NextResponse.json({ stocks: result.updatedStocksCount, sales: result.updatedSalesCount, countLines: result.updatedCountLinesCount, shelfAssignments: result.updatedShelfCount })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to merge products" }, { status: 500 })
  }
}
