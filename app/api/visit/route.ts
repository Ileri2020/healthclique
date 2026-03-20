import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/visit - Record a page visit (called from browser, works for all users including unauthenticated)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || "/";
    const browserId = body.browserId || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Only record once per browserId per path per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.visit.findFirst({
      where: {
        path,
        browserId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (!existing) {
      await prisma.visit.create({
        data: { path, userAgent, ip, browserId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Visit tracking error:", err);
    // Return success anyway — we never want tracking to break the user experience
    return NextResponse.json({ ok: true });
  }
}


// GET /api/visit - Returns daily visit counts for the analytics dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400000);
    const to = toStr ? new Date(toStr) : new Date();

    const visitsRaw = await prisma.visit.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, path: true },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    visitsRaw.forEach((v) => {
      const day = v.createdAt.toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const dailyVisits = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ dailyVisits, total: visitsRaw.length });
  } catch (err) {
    console.error("Visit GET error:", err);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
