import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const staffOnly = async () => {
  const session = await auth()
  const role = session?.user?.role?.trim().toLowerCase()
  return role === "admin" || role === "staff"
}

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export async function GET(request: Request) {
  if (!(await staffOnly())) return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })

  const customerName = new URL(request.url).searchParams.get("customerName")?.trim()
  if (!customerName) return NextResponse.json({ error: "Customer name is required" }, { status: 400 })

  try {
    const readings = await prisma.vitalReading.findMany({
      where: { customerName },
      orderBy: [{ recordedAt: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json(readings)
  } catch (error) {
    console.error("Unable to load vital readings", error)
    return NextResponse.json({ error: "Unable to load vital readings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await staffOnly())) return NextResponse.json({ error: "Admin or staff access required" }, { status: 403 })

  try {
    const body = await request.json()
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : ""
    const recordedAt = parseDate(body.date)
    const systolic = Number(body.systolic)
    const diastolic = Number(body.diastolic)
    const pulse = Number(body.pulse)
    const bloodSugar = body.bloodSugar === "" || body.bloodSugar == null ? undefined : Number(body.bloodSugar)

    if (!customerName) return NextResponse.json({ error: "Select a customer" }, { status: 400 })
    if (!recordedAt) return NextResponse.json({ error: "Enter a valid date" }, { status: 400 })
    if (!Number.isInteger(systolic) || systolic < 30 || systolic > 300) return NextResponse.json({ error: "Systolic pressure must be between 30 and 300 mmHg" }, { status: 400 })
    if (!Number.isInteger(diastolic) || diastolic < 20 || diastolic > 200) return NextResponse.json({ error: "Diastolic pressure must be between 20 and 200 mmHg" }, { status: 400 })
    if (systolic <= diastolic) return NextResponse.json({ error: "Systolic pressure must be higher than diastolic pressure" }, { status: 400 })
    if (!Number.isInteger(pulse) || pulse < 20 || pulse > 250) return NextResponse.json({ error: "Pulse must be between 20 and 250 bpm" }, { status: 400 })
    if (bloodSugar !== undefined && (!Number.isFinite(bloodSugar) || bloodSugar < 20 || bloodSugar > 1000)) return NextResponse.json({ error: "Blood sugar must be between 20 and 1000 mg/dL" }, { status: 400 })

    const reading = await prisma.vitalReading.create({
      data: { customerName, recordedAt, systolic, diastolic, pulse, bloodSugar },
    })
    return NextResponse.json(reading, { status: 201 })
  } catch (error) {
    console.error("Unable to save vital reading", error)
    return NextResponse.json({ error: "Unable to save vital reading" }, { status: 500 })
  }
}
