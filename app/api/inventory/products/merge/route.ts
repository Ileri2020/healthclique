import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { mergeInventoryProductNames } from "@/lib/merge-inventory-products"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role?.toLowerCase()
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })
    }
    const body = await req.json()
    const { sourceProductName, targetProductName } = body

    const source = typeof sourceProductName === "string" ? sourceProductName.trim() : ""
    const target = typeof targetProductName === "string" ? targetProductName.trim() : ""

    if (!source || !target) {
      return NextResponse.json({ error: "Source and target product names are required" }, { status: 400 })
    }

    if (source.toLowerCase() === target.toLowerCase()) {
      return NextResponse.json({ error: "Source and target product names must be different" }, { status: 400 })
    }

    const result = await mergeInventoryProductNames(source, target)
    return NextResponse.json({ success: true, sourceProductName: source, targetProductName: target, ...result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to merge products" }, { status: 500 })
  }
}
