import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeStatus } from "@/lib/risk";

export const dynamic = "force-dynamic";

const statuses = ["Approved", "Rejected", "Under_Investigation"];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");
    const normalizedStatus = status ? normalizeStatus(status) : "";
    if (normalizedStatus && !statuses.includes(normalizedStatus)) {
      return jsonError("Invalid status filter.", 400);
    }

    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (from) {
      fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return jsonError("Invalid 'from' date format.", 400);
      }
    }
    if (to) {
      toDate = new Date(`${to}T23:59:59`);
      if (Number.isNaN(toDate.getTime())) {
        return jsonError("Invalid 'to' date format.", 400);
      }
    }

    const where = {
      ...(params.get("officer") ? { officerName: { contains: params.get("officer")!, mode: "insensitive" as const } } : {}),
      ...(normalizedStatus ? { status: normalizedStatus as "Approved" | "Rejected" | "Under_Investigation" } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {})
            }
          }
        : {})
    };
    const decisions = await prisma.decision.findMany({
      where,
      include: { applicant: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(decisions);
  } catch (error) {
    logApiError("GET /api/decisions", error);
    return jsonError("Unable to load decision log.", 500, getErrorMessage(error));
  }
}
