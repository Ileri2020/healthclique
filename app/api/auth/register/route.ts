import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const ACCOUNT_ROLES = ["customer", "professional", "wholesaler"] as const;
const PROFESSIONAL_TYPES = ["pharmacist", "doctor", "nurse"] as const;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "customer";

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return NextResponse.json(
      { error: "Provide a valid name and email address, and a password of at least 8 characters." },
      { status: 400 },
    );
  }
  if (!ACCOUNT_ROLES.includes(role as (typeof ACCOUNT_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
  }

  const professionalType = typeof body.professionalType === "string" ? body.professionalType : "";
  const regNumber = typeof body.regNumber === "string" ? body.regNumber.trim() : "";
  const facilityName = typeof body.facilityName === "string" ? body.facilityName.trim() : "";
  const facilityAddress = typeof body.facilityAddress === "string" ? body.facilityAddress.trim() : "";
  const facilityRegNumber = typeof body.facilityRegNumber === "string" ? body.facilityRegNumber.trim() : "";

  if (role === "professional" &&
      (!PROFESSIONAL_TYPES.includes(professionalType as (typeof PROFESSIONAL_TYPES)[number]) || !regNumber)) {
    return NextResponse.json({ error: "Professional type and registration number are required." }, { status: 400 });
  }
  if (role === "wholesaler" && (!facilityName || !facilityAddress || !facilityRegNumber)) {
    return NextResponse.json({ error: "Facility name, address, and registration number are required." }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, await bcrypt.genSalt()),
        role,
        verificationStatus: role === "customer" ? "unverified" : "pending",
        professionalType: role === "professional" ? professionalType : undefined,
        regNumber: role === "professional" ? regNumber : undefined,
        facilityName: role === "wholesaler" ? facilityName : undefined,
        facilityAddress: role === "wholesaler" ? facilityAddress : undefined,
        facilityRegNumber: role === "wholesaler" ? facilityRegNumber : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verificationStatus: true,
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedReturns: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Account registration failed:", error);
    return NextResponse.json({ error: "Account registration failed." }, { status: 500 });
  }
}
