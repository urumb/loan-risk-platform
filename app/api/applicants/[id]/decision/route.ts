import { NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeStatus } from "@/lib/risk";

export const dynamic = "force-dynamic";

const statuses = ["Approved", "Rejected", "Under_Investigation"];

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const status = normalizeStatus(String(body.status));
    if (!statuses.includes(status)) {
      return jsonError("Invalid status", 400);
    }
    if (!String(body.officerName ?? "").trim() || !String(body.comment ?? "").trim()) {
      return jsonError("Officer name and comment are required", 400);
    }
    const applicant = await prisma.applicant.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!applicant) {
      return jsonError("Applicant not found", 404);
    }
    const decision = await prisma.decision.create({
      data: {
        applicantId: params.id,
        status: status as "Approved" | "Rejected" | "Under_Investigation",
        officerName: String(body.officerName).trim(),
        comment: String(body.comment).trim()
      }
    });
    return NextResponse.json(decision, { status: 201 });
  } catch (error) {
    logApiError("POST /api/applicants/[id]/decision", error);
    return jsonError("Unable to save decision.", 500, getErrorMessage(error));
  }
}
