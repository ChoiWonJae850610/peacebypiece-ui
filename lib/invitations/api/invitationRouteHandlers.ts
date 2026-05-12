import { NextResponse } from "next/server";

import {
  evaluateInvitationPolicy,
  getDefaultInvitationExpiresAt,
} from "../invitationPolicy";
import { invitationRepository } from "../invitationRepository";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildInvitationCreatedAuditLog } from "@/lib/system/audit/writeActions";
import type {
  InvitationDraft,
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
} from "../invitationTypes";

const SAMPLE_COMPANY_ID = "company-sample-customer";
const SAMPLE_ADMIN_USER_ID = "user-sample-admin";
const SAMPLE_SYSTEM_USER_ID = "system-user-sample-admin";

interface CreateInvitationRequestBody {
  companyId?: string | null;
  inviterCompanyId?: string | null;
  recipientEmail?: string | null;
  recipientRole?: InvitationRecipientRole | null;
  permissionPreset?: InvitationPermissionPreset | null;
  scope?: InvitationScope | null;
  expiresAt?: string | null;
  createdByUserId?: string | null;
  createdBySystemUserId?: string | null;
}


function getRequestId(request: Request): string | null {
  return request.headers.get("x-request-id") || request.headers.get("x-vercel-id") || null;
}

function getRequestIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || null;
}

function toInvitationDraft(body: CreateInvitationRequestBody): InvitationDraft {
  const scope = body.scope ?? "company_to_member";
  const recipientRole = body.recipientRole ?? (scope === "system_to_company_admin" ? "admin" : "viewer");
  const permissionPreset =
    body.permissionPreset ??
    (recipientRole === "admin" ? "company_admin" : recipientRole);
  const inviterCompanyId = body.inviterCompanyId ?? (scope === "company_to_member" ? SAMPLE_COMPANY_ID : null);

  return {
    companyId: body.companyId ?? inviterCompanyId ?? null,
    inviterCompanyId,
    recipientEmail: body.recipientEmail ?? "",
    recipientRole,
    permissionPreset,
    scope,
    expiresAt: body.expiresAt ?? getDefaultInvitationExpiresAt(),
    createdByUserId: body.createdByUserId ?? (scope === "company_to_member" ? SAMPLE_ADMIN_USER_ID : null),
    createdBySystemUserId: body.createdBySystemUserId ?? (scope === "system_to_company_admin" ? SAMPLE_SYSTEM_USER_ID : null),
  };
}

function toBadRequestResponse(reasons: string[]) {
  return NextResponse.json(
    {
      ok: false,
      error: "INVITATION_POLICY_REJECTED",
      reasons,
    },
    { status: 400 },
  );
}

function toErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: "INVITATION_ROUTE_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown invitation route error",
    },
    { status: 500 },
  );
}

export async function handleListInvitations(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        {
          ok: false,
          error: "COMPANY_ID_REQUIRED",
        },
        { status: 400 },
      );
    }

    const invitations = await invitationRepository.listInvitations(companyId);

    return NextResponse.json({
      ok: true,
      invitations,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCreateInvitation(request: Request) {
  try {
    const body = (await request.json()) as CreateInvitationRequestBody;
    const draft = toInvitationDraft(body);

    const policy = evaluateInvitationPolicy({
      scope: draft.scope,
      companyId: draft.companyId,
      inviterCompanyId: draft.inviterCompanyId,
      recipientEmail: draft.recipientEmail,
      recipientRole: draft.recipientRole,
      permissionPreset: draft.permissionPreset,
      expiresAt: draft.expiresAt,
    });

    if (!policy.canCreate) {
      return toBadRequestResponse(policy.reasons);
    }

    const result = await invitationRepository.createInvitation(draft);

    await createSystemAuditLogSafe(
      buildInvitationCreatedAuditLog({
        invitationId: result.invitation.id,
        scope: result.invitation.scope,
        companyId: result.invitation.companyId,
        recipientEmail: result.invitation.recipientEmail,
        recipientRole: result.invitation.recipientRole,
        permissionPreset: result.invitation.permissionPreset,
        expiresAt: result.invitation.expiresAt,
        createdByUserId: result.invitation.createdByUserId,
        createdBySystemUserId: result.invitation.createdBySystemUserId,
        inviteUrlPath: result.inviteUrl,
        requestId: getRequestId(request),
        ipAddress: getRequestIpAddress(request),
      }),
    );

    const { tokenHash: _tokenHash, ...publicInvitation } = result.invitation;

    return NextResponse.json(
      {
        ok: true,
        invitation: publicInvitation,
        rawToken: result.rawToken,
        inviteUrl: result.inviteUrl,
        tokenPolicy: "raw token is returned only once and must never be stored in DB",
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
