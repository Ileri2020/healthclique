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
      where: { role: "customer", name: { isSet: true } },
      select: { name: true },
    }).catch((error) => {
      console.error("Unable to load customer account names", error)
      return []
    })

    const customerSet = new Set<string>()

    const customerNames = [...sales.map((sale) => sale.customerName), ...accounts.map((account) => account.name)]
    customerNames.forEach((customerName) => {
      const name = customerName?.trim()
      if (name) {
        customerSet.add(name)
      }
    })

    const customers = Array.from(customerSet).sort((a, b) =>
      a.localeCompare(b)
    )

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}
