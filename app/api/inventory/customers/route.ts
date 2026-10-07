import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sales = await prisma.inventorySale.findMany({
      where: { customerName: { isSet: true } },
      select: { customerName: true },
      orderBy: { createdAt: "desc" },
    })

    const accounts = await prisma.user.findMany({
      where: { name: { isSet: true } },
      select: { name: true },
    }).catch((error) => {
      console.error("Unable to load user account names", error)
      return []
    })

    const uniqueNames = new Map<string, string>()
    const accountNames = accounts.map((account) => account.name)
    const previousSalesNames = sales.map((sale) => sale.customerName)
    ;[...accountNames, ...previousSalesNames].forEach((customerName) => {
      const name = customerName?.replace(/\s+/g, " ").trim()
      if (!name) return
      const key = name.toLocaleLowerCase()
      // Accounts are inserted first, so existing account spelling wins over older free-text variants.
      if (!uniqueNames.has(key)) uniqueNames.set(key, name)
    })

    const customers = Array.from(uniqueNames.values()).sort((a, b) =>
      a.localeCompare(b)
    )

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}
