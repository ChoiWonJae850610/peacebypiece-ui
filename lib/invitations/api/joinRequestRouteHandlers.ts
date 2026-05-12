import { NextResponse } from "next/server";

import { joinRequestRepository } from "../joinRequestRepository";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildJoinRequestCreatedAuditLog } from "@/lib/system/audit/writeActions";
import { invitationRepository } from "../invitationRepository";
import type { JoinRequestDraft, JoinRequestStatus, JoinRequestType } from "../joinRequestTypes";

interface CreateJoinRequestBody {
  token?: string | null;
  rawToken?: string | null;
  requestType?: JoinRequestType | null;
  applicantName?: string | null;
  applicantEmail?: string | null;
  applicantPhone?: string | null;
  requestedCompanyName?: string | null;
  businessName?: string | null;
  requestMemo?: string | null;
  userId?: string | null;
}


function getRequestId(request: Request): string | null {
  return request.headers.get("x-request-id") || request.headers.get("x-vercel-id") || null;
}

function getRequestIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || null;
}

function toPublicInvitation(invitation: Awaited<ReturnType<typeof invitationRepository.findInvitationByRawToken>>) {
  if (!invitation) return null;
  const { tokenHash: _tokenHash, ...publicInvitation } = invitation;
  return publicInvitation;
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown join request error";
  const status =
    message === "INVITATION_NOT_FOUND" ? 404 :
    message === "INVITATION_EXPIRED" ? 410 :
    message === "JOIN_REQUEST_ALREADY_PENDING" ? 409 :
    message.endsWith("_REQUIRED") || message === "INVITATION_SCOPE_MISMATCH" || message === "INVITATION_NOT_ACTIVE" ? 400 :
    500;

  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status },
  );
}

function readExpectedRequestType(value: string | null): JoinRequestType | null {
  return value === "company" || value === "member" ? value : null;
}

function assertInvitationScope(
  invitation: NonNullable<Awaited<ReturnType<typeof invitationRepository.findInvitationByRawToken>>>,
  expectedRequestType?: JoinRequestType | null,
): void {
  if (!expectedRequestType) return;

  const expectedScope = expectedRequestType === "company" ? "system_to_company_admin" : "company_to_member";
  if (invitation.scope !== expectedScope) {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }
}

export async function handleVerifyInvitation(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim() || "";
    const expectedRequestType = readExpectedRequestType(url.searchParams.get("requestType"));

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVITATION_TOKEN_REQUIRED",
        },
        { status: 400 },
      );
    }

    const invitation = await invitationRepository.findInvitationByRawToken(token);
    if (!invitation) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVITATION_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    assertInvitationScope(invitation, expectedRequestType);

    const expiresAtTime = new Date(invitation.expiresAt).getTime();
    const isExpired = Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();
    const isJoinable = (invitation.status === "pending" || invitation.status === "active") && !isExpired;

    return NextResponse.json({
      ok: true,
      invitation: toPublicInvitation(invitation),
      isJoinable,
      tokenPolicy: "raw token is converted to token_hash for lookup and is not returned",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}


const JOIN_REQUEST_TYPES = new Set<JoinRequestType>(["member", "company"]);
const JOIN_REQUEST_STATUSES = new Set<JoinRequestStatus>(["pending", "approved", "rejected", "cancelled"]);

function readJoinRequestType(value: string | null): JoinRequestType | null {
  return value && JOIN_REQUEST_TYPES.has(value as JoinRequestType) ? (value as JoinRequestType) : null;
}

function readJoinRequestStatus(value: string | null): JoinRequestStatus | null {
  return value && JOIN_REQUEST_STATUSES.has(value as JoinRequestStatus) ? (value as JoinRequestStatus) : null;
}

function readLimit(value: string | null): number {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
}

export async function handleListJoinRequests(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await joinRequestRepository.listJoinRequests({
      id: url.searchParams.get("requestId") || url.searchParams.get("id"),
      applicantEmail: url.searchParams.get("applicantEmail") || url.searchParams.get("email"),
      requestType: readJoinRequestType(url.searchParams.get("requestType") || url.searchParams.get("type")),
      status: readJoinRequestStatus(url.searchParams.get("status")) || "pending",
      limit: readLimit(url.searchParams.get("limit")),
    });

    return NextResponse.json({
      ok: true,
      joinRequests: result.joinRequests,
      primaryJoinRequest: result.primaryJoinRequest,
      lookupPolicy: "requestId is preferred; applicantEmail lookup is for OAuth-before testing only",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toJoinRequestDraft(body: CreateJoinRequestBody): JoinRequestDraft {
  return {
    rawToken: body.rawToken ?? body.token ?? "",
    requestType: body.requestType ?? "member",
    applicantName: body.applicantName ?? "",
    applicantEmail: body.applicantEmail ?? "",
    applicantPhone: body.applicantPhone ?? null,
    requestedCompanyName: body.requestedCompanyName ?? null,
    businessName: body.businessName ?? null,
    requestMemo: body.requestMemo ?? null,
    userId: body.userId ?? null,
  };
}

export async function handleCreateJoinRequest(request: Request) {
  try {
    const body = (await request.json()) as CreateJoinRequestBody;
    const result = await joinRequestRepository.createJoinRequest(toJoinRequestDraft(body));
    const publicInvitation = toPublicInvitation(result.invitation);

    await createSystemAuditLogSafe(
      buildJoinRequestCreatedAuditLog({
        joinRequestId: result.joinRequest.id,
        invitationId: result.joinRequest.invitationId,
        requestType: result.joinRequest.requestType,
        companyId: result.invitation.companyId,
        applicantEmail: result.joinRequest.applicantEmail,
        applicantName: result.joinRequest.applicantName,
        requestedCompanyName: result.joinRequest.requestedCompanyName,
        requestId: getRequestId(request),
        ipAddress: getRequestIpAddress(request),
      }),
    );

    return NextResponse.json(
      {
        ok: true,
        invitation: publicInvitation,
        joinRequest: result.joinRequest,
        redirectPath: result.redirectPath,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
