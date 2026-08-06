import { NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: params.id },
      include: {
        decisions: { orderBy: { createdAt: "desc" } },
        aiExplanation: true
      }
    });

    if (!applicant) {
      return jsonError("Applicant not found", 404);
    }

    return NextResponse.json(applicant);
  } catch (error) {
    logApiError("GET /api/applicants/[id]", error);
    return jsonError("Unable to load applicant.", 500, getErrorMessage(error));
  }
}
