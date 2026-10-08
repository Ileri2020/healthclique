import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const canManageAccounts = async () => {
  const session = await auth()
  const role = session?.user?.role?.trim().toLowerCase()
  return role === "admin" || role === "staff"
}

export async function POST(request: Request) {
  if (!(await canManageAccounts())) return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const contact = typeof body.contact === "string" ? body.contact.trim() : ""

    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Enter a name between 2 and 120 characters" }, { status: 400 })
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const password = await bcrypt.hash("password", 10)
    const user = await prisma.user.create({
      data: {
        name,
        // User.email is currently required and unique; use an unrouteable placeholder for no-email records.
        email: email || `no-email-${randomUUID()}@healthclique.invalid`,
        ...(contact ? { contact } : {}),
        password,
        role: "customer",
        verificationStatus: "unverified",
      },
      select: { id: true, name: true, email: true, role: true, contact: true, createdAt: true },
    })

    return NextResponse.json({ user: { ...user, email: email || null }, defaultPassword: "password" }, { status: 201 })
  } catch (error) {
    console.error("Unable to create staff-registered user", error)
    return NextResponse.json({ error: "Unable to create customer account" }, { status: 500 })
  }
}
