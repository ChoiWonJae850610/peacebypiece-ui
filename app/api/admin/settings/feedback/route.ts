import { NextResponse } from "next/server";

import {
  createCompanyFeedbackRequest,
  isCompanyFeedbackType,
  listCompanyFeedbackRequests,
} from "@/lib/admin/settings/companyFeedbackRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompanyFeedbackPayload = {
  feedbackType?: unknown;
  title?: unknown;
  message?: unknown;
  source?: unknown;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_COMPANY_FEEDBACK_ERROR");
}

async function readPayload(request: Request): Promise<CompanyFeedbackPayload> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as CompanyFeedbackPayload) : {};
}

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const requests = await listCompanyFeedbackRequests(scopeResult.companyScope.companyId, 5);
    return NextResponse.json({ ok: true, requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { ok: false, error: "COMPANY_FEEDBACK_LIST_FAILED", message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = await readPayload(request);
    if (!isCompanyFeedbackType(payload.feedbackType)) {
      return NextResponse.json(
        { ok: false, error: "COMPANY_FEEDBACK_INVALID_TYPE" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { companyId, userId } = scopeResult.companyScope;
    const feedback = await createCompanyFeedbackRequest({
      companyId,
      requestedByUserId: userId,
      feedbackType: payload.feedbackType,
      title: payload.title,
      message: payload.message,
      source: payload.source,
    });

    await createSystemAuditLogSafe({
      actorUserId: userId,
      actorRole: "customer_admin",
      companyId,
      targetType: "settings",
      targetId: feedback.id,
      eventType: "settings.feedback.created",
      severity: feedback.feedbackType === "bug" ? "medium" : "low",
      summary: feedback.title,
      metadata: {
        feedbackType: feedback.feedbackType,
        feedbackStatus: feedback.feedbackStatus,
      },
    });

    return NextResponse.json({ ok: true, feedback }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = getErrorMessage(error);
    const badRequestErrors = new Set([
      "COMPANY_FEEDBACK_TITLE_TOO_SHORT",
      "COMPANY_FEEDBACK_TITLE_TOO_LONG",
      "COMPANY_FEEDBACK_MESSAGE_TOO_SHORT",
      "COMPANY_FEEDBACK_MESSAGE_TOO_LONG",
    ]);
    const status = badRequestErrors.has(message) ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: status === 400 ? message : "COMPANY_FEEDBACK_CREATE_FAILED", message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
