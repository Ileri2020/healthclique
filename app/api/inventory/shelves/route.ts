import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const shelves = await prisma.shelf.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(shelves)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, number, rowFrom, rowTo, columnFrom, columnTo } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Shelf name is required" }, { status: 400 })
    }

    const shelf = await prisma.shelf.create({
      data: {
        name: name.trim(),
        number: number ? String(number).trim() : undefined,
        rowFrom: rowFrom !== "" && rowFrom !== undefined && rowFrom !== null ? Number(rowFrom) : undefined,
        rowTo: rowTo !== "" && rowTo !== undefined && rowTo !== null ? Number(rowTo) : undefined,
        columnFrom: columnFrom !== "" && columnFrom !== undefined && columnFrom !== null ? Number(columnFrom) : undefined,
        columnTo: columnTo !== "" && columnTo !== undefined && columnTo !== null ? Number(columnTo) : undefined,
      },
    })

    return NextResponse.json(shelf)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to create shelf" }, { status: 500 })
  }
}
