import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { mergeInventoryProductNames } from "@/lib/merge-inventory-products"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role?.trim().toLowerCase()
    if (role !== "admin") {
      if (role !== "staff") return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })
    }
    const body = await req.json()
    const { sourceProductName, sourceProductNames, targetProductName } = body

    const sources: string[] = Array.isArray(sourceProductNames)
      ? sourceProductNames.map((s: any) => String(s).trim()).filter(Boolean)
      : typeof sourceProductName === "string" && sourceProductName.trim()
        ? [sourceProductName.trim()]
        : []
    const target = typeof targetProductName === "string" ? targetProductName.trim() : ""

    if (!sources.length || !target) {
      return NextResponse.json({ error: "Source and target product names are required" }, { status: 400 })
    }

    const filteredSources = sources.filter((s) => s.toLowerCase() !== target.toLowerCase())
    if (!filteredSources.length) {
      return NextResponse.json({ error: "At least one source product must be different from target product" }, { status: 400 })
    }

    const result = await mergeInventoryProductNames(filteredSources, target)
    return NextResponse.json({
      success: true,
      sourceProductName: filteredSources[0],
      sourceProductNames: filteredSources,
      targetProductName: target,
      ...result,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to merge products" }, { status: 500 })
  }
}
