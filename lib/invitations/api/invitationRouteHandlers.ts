import { NextResponse } from "next/server";

import {
  evaluateInvitationPolicy,
  getDefaultInvitationExpiresAt,
} from "../invitationPolicy";
import { invitationRepository } from "../invitationRepository";
import type {
  InvitationDraft,
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
} from "../invitationTypes";

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

function toInvitationDraft(body: CreateInvitationRequestBody): InvitationDraft {
  const scope = body.scope ?? "company_to_member";
  const recipientRole = body.recipientRole ?? "viewer";
  const permissionPreset =
    body.permissionPreset ??
    (recipientRole === "admin" ? "company_admin" : recipientRole);

  return {
    companyId: body.companyId ?? body.inviterCompanyId ?? "",
    inviterCompanyId: body.inviterCompanyId ?? null,
    recipientEmail: body.recipientEmail ?? "",
    recipientRole,
    permissionPreset,
    scope,
    expiresAt: body.expiresAt ?? getDefaultInvitationExpiresAt(),
    createdByUserId: body.createdByUserId ?? null,
    createdBySystemUserId: body.createdBySystemUserId ?? null,
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

    return NextResponse.json(
      {
        ok: true,
        invitation: result.invitation,
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
