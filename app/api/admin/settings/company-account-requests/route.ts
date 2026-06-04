import { NextResponse } from "next/server";

import {
  createCompanyAccountRequest,
  isCompanyAccountRequestType,
  listCompanyAccountRequests,
  validateCompanyAccountRequestMessage,
} from "@/lib/admin/settings/companyAccountRequestRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";

export const runtime = "nodejs";

const COMPANY_ACCOUNT_REQUEST_INVALID_TYPE = "COMPANY_ACCOUNT_REQUEST_INVALID_TYPE";
const COMPANY_ACCOUNT_REQUEST_CREATE_FAILED = "COMPANY_ACCOUNT_REQUEST_CREATE_FAILED";

type CompanyAccountRequestPayload = {
  requestType?: unknown;
  message?: unknown;
  source?: unknown;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_COMPANY_ACCOUNT_REQUEST_ERROR");
}

async function readPayload(request: Request): Promise<CompanyAccountRequestPayload> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as CompanyAccountRequestPayload) : {};
}


export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const { companyId } = scopeResult.companyScope;
    const requests = await listCompanyAccountRequests(companyId, 5);
    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    const message = getErrorMessage(error);

    return NextResponse.json(
      {
        ok: false,
        error: "COMPANY_ACCOUNT_REQUEST_LIST_FAILED",
        message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = await readPayload(request);
    const requestType = payload.requestType;

    if (!isCompanyAccountRequestType(requestType)) {
      return NextResponse.json(
        { ok: false, error: COMPANY_ACCOUNT_REQUEST_INVALID_TYPE },
        { status: 400 },
      );
    }

    const message = validateCompanyAccountRequestMessage(payload.message);
    const { companyId, userId } = scopeResult.companyScope;
    const accountRequest = await createCompanyAccountRequest({
      companyId,
      requestedByUserId: userId,
      requestType,
      requestMessage: message,
      requestPayload: {
        source: typeof payload.source === "string" ? payload.source : "admin_settings",
      },
    });

    await createSystemAuditLogSafe({
      actorUserId: userId,
      actorRole: "customer_admin",
      companyId,
      targetType: "settings",
      targetId: accountRequest.id,
      eventType: "settings.requested",
      severity: requestType === "account_deactivation" ? "high" : "medium",
      summary: accountRequest.requestTitle,
      metadata: {
        requestType,
        requestStatus: accountRequest.requestStatus,
      },
    });

    return NextResponse.json({ ok: true, request: accountRequest });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message === "COMPANY_ACCOUNT_REQUEST_MESSAGE_TOO_SHORT" || message === "COMPANY_ACCOUNT_REQUEST_MESSAGE_TOO_LONG" ? 400 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: status === 400 ? message : COMPANY_ACCOUNT_REQUEST_CREATE_FAILED,
        message,
      },
      { status },
    );
  }
}
