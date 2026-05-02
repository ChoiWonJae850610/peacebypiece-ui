import "server-only";

import { createHash } from "crypto";

import { queryDb } from "@/lib/db/client";

import type {
  InvitationAcceptanceResult,
  InvitationAcceptanceStatus,
} from "./invitationAcceptanceTypes";
import type { InvitationRecord } from "./invitationTypes";

type InvitationAcceptRow = {
  id: string;
  company_id: string;
  recipient_email: string;
  recipient_role: InvitationRecord["recipientRole"];
  permission_preset: InvitationRecord["permissionPreset"];
  scope: InvitationRecord["scope"];
  status: InvitationRecord["status"];
  token_hash: string;
  accepted_at: Date | string | null;
  revoked_at: Date | string | null;
  expires_at: Date | string;
  created_by_user_id: string | null;
  created_by_system_user_id: string | null;
  accepted_user_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function createTokenHash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function normalizeToken(rawToken: string): string {
  return rawToken.trim();
}

function isExpired(expiresAt: string): boolean {
  const expiresAtTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtTime)) {
    return false;
  }

  return expiresAtTime <= Date.now();
}

function toInvitationRecord(row: InvitationAcceptRow): InvitationRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    recipientEmail: row.recipient_email,
    recipientRole: row.recipient_role,
    permissionPreset: row.permission_preset,
    scope: row.scope,
    status: row.status,
    tokenHash: row.token_hash,
    acceptedAt: toIsoString(row.accepted_at),
    revokedAt: toIsoString(row.revoked_at),
    expiresAt: toIsoString(row.expires_at) ?? new Date().toISOString(),
    createdByUserId: row.created_by_user_id,
    createdBySystemUserId: row.created_by_system_user_id,
    acceptedUserId: row.accepted_user_id,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function resolveAcceptanceStatus(
  invitation: InvitationRecord,
): InvitationAcceptanceStatus {
  if (invitation.status === "accepted") {
    return "accepted";
  }

  if (invitation.status === "revoked") {
    return "revoked";
  }

  if (invitation.status === "expired") {
    return "expired";
  }

  if (invitation.status === "pending" && isExpired(invitation.expiresAt)) {
    return "expired";
  }

  return "ready";
}

function toMessage(status: InvitationAcceptanceStatus): string {
  if (status === "ready") {
    return "초대 수락 준비가 완료되었습니다.";
  }

  if (status === "accepted") {
    return "이미 수락된 초대입니다.";
  }

  if (status === "expired") {
    return "만료된 초대입니다.";
  }

  if (status === "revoked") {
    return "취소된 초대입니다.";
  }

  return "유효하지 않은 초대입니다.";
}

async function findInvitationByRawToken(
  rawToken: string,
): Promise<InvitationRecord | null> {
  const token = normalizeToken(rawToken);

  if (!token) {
    return null;
  }

  const tokenHash = createTokenHash(token);

  const result = await queryDb<InvitationAcceptRow>(
    `
    SELECT
      id,
      company_id,
      recipient_email,
      recipient_role,
      permission_preset,
      scope,
      status,
      token_hash,
      accepted_at,
      revoked_at,
      expires_at,
      created_by_user_id,
      created_by_system_user_id,
      accepted_user_id,
      created_at,
      updated_at
    FROM invitations
    WHERE token_hash = $1
    LIMIT 1
    `,
    [tokenHash],
  );

  const row = result.rows[0];

  return row ? toInvitationRecord(row) : null;
}

export async function previewInvitationAcceptance(
  rawToken: string,
): Promise<InvitationAcceptanceResult> {
  const invitation = await findInvitationByRawToken(rawToken);

  if (!invitation) {
    return {
      ok: false,
      status: "invalid",
      invitation: null,
      message: "유효하지 않은 초대 링크입니다.",
    };
  }

  const status = resolveAcceptanceStatus(invitation);

  return {
    ok: true,
    status,
    invitation,
    message: toMessage(status),
  };
}

export async function acceptInvitationByToken(input: {
  rawToken: string;
  acceptedUserId?: string | null;
}): Promise<InvitationAcceptanceResult> {
  const preview = await previewInvitationAcceptance(input.rawToken);

  if (!preview.ok || !preview.invitation) {
    return preview;
  }

  if (preview.status !== "ready") {
    return preview;
  }

  const result = await queryDb<InvitationAcceptRow>(
    `
    UPDATE invitations
    SET
      status = 'accepted',
      accepted_at = now(),
      accepted_user_id = $2,
      updated_at = now()
    WHERE id = $1
      AND status = 'pending'
      AND expires_at > now()
    RETURNING
      id,
      company_id,
      recipient_email,
      recipient_role,
      permission_preset,
      scope,
      status,
      token_hash,
      accepted_at,
      revoked_at,
      expires_at,
      created_by_user_id,
      created_by_system_user_id,
      accepted_user_id,
      created_at,
      updated_at
    `,
    [preview.invitation.id, input.acceptedUserId ?? null],
  );

  const row = result.rows[0];

  if (!row) {
    return previewInvitationAcceptance(input.rawToken);
  }

  const invitation = toInvitationRecord(row);

  return {
    ok: true,
    status: "accepted",
    invitation,
    message: "초대 수락 처리가 완료되었습니다.",
  };
}
