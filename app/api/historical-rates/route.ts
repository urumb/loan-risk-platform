import { NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rates = await prisma.historicalDefaultRate.findMany({ orderBy: [{ branch: "asc" }, { category: "asc" }] });
    return NextResponse.json(rates);
  } catch (error) {
    logApiError("GET /api/historical-rates", error);
    return jsonError("Unable to load historical rates.", 500, getErrorMessage(error));
  }
}
