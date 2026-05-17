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

import { requireAdminMemberCompanyScope } from "@/lib/admin/members/sessionScope";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";

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

function toInvitationDraft(
  body: CreateInvitationRequestBody,
  sessionCompanyScope?: { companyId: string; userId: string } | null,
  systemScope?: { userId: string } | null,
): InvitationDraft {
  const scope = body.scope ?? "company_to_member";
  const recipientRole = body.recipientRole ?? (scope === "system_to_company_admin" ? "admin" : "viewer");
  const permissionPreset =
    body.permissionPreset ??
    (recipientRole === "admin" ? "company_admin" : recipientRole);
  const inviterCompanyId = scope === "company_to_member"
    ? sessionCompanyScope?.companyId ?? null
    : body.inviterCompanyId ?? null;

  return {
    companyId: scope === "company_to_member"
      ? sessionCompanyScope?.companyId ?? null
      : body.companyId ?? inviterCompanyId ?? null,
    inviterCompanyId,
    recipientEmail: body.recipientEmail ?? "",
    recipientRole,
    permissionPreset,
    scope,
    expiresAt: body.expiresAt ?? getDefaultInvitationExpiresAt(),
    createdByUserId: scope === "company_to_member"
      ? sessionCompanyScope?.userId ?? null
      : body.createdByUserId ?? null,
    createdBySystemUserId: scope === "system_to_company_admin"
      ? systemScope?.userId ?? body.createdBySystemUserId ?? null
      : body.createdBySystemUserId ?? null,
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
    const scope = await requireAdminMemberCompanyScope();
    if (!scope.ok) return scope.response;

    const invitations = await invitationRepository.listInvitations(
      scope.companyScope.companyId,
    );

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
    const requestedScope = body.scope ?? "company_to_member";
    const companyScope = requestedScope === "company_to_member"
      ? await requireAdminMemberCompanyScope()
      : null;
    const systemScope = requestedScope === "system_to_company_admin"
      ? await requireSystemAdminScope()
      : null;

    if (companyScope && !companyScope.ok) return companyScope.response;
    if (systemScope && !systemScope.ok) return systemScope.response;

    const draft = toInvitationDraft(
      body,
      companyScope?.ok
        ? {
            companyId: companyScope.companyScope.companyId,
            userId: companyScope.companyScope.userId,
          }
        : null,
      systemScope?.ok
        ? {
            userId: systemScope.systemScope.userId,
          }
        : null,
    );

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
