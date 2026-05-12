import { createHash, randomBytes, randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { getDefaultInvitationExpiresAt } from "./invitationPolicy";
import type {
  InvitationCreateResult,
  InvitationDraft,
  InvitationRecord,
  InvitationRepository,
} from "./invitationTypes";

const inMemoryInvitations: InvitationRecord[] = [];

function createRawInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createInvitationTokenHash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createInviteUrl(rawToken: string, scope: InvitationDraft["scope"]): string {
  if (scope === "company_to_member") {
    return `/invite/member/${rawToken}`;
  }

  return `/invite/company/${rawToken}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createInvitationRecord(
  draft: InvitationDraft,
  tokenHash: string,
): InvitationRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    companyId: draft.companyId ?? null,
    recipientEmail: normalizeEmail(draft.recipientEmail),
    recipientRole: draft.recipientRole,
    permissionPreset: draft.permissionPreset,
    scope: draft.scope,
    status: "pending",
    tokenHash,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: draft.expiresAt || getDefaultInvitationExpiresAt(),
    createdByUserId: draft.createdByUserId ?? null,
    createdBySystemUserId: draft.createdBySystemUserId ?? null,
    acceptedUserId: null,
    createdAt: now,
    updatedAt: now,
  };
}

type InvitationDbRow = {
  id: string;
  company_id: string | null;
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

function toIsoString(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toInvitationRecord(row: InvitationDbRow): InvitationRecord {
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

async function createDbInvitation(draft: InvitationDraft, tokenHash: string): Promise<InvitationRecord> {
  const result = await queryDb<InvitationDbRow>(
    `
      INSERT INTO invitations (
        company_id,
        scope,
        recipient_email,
        recipient_role,
        permission_preset,
        token_hash,
        status,
        expires_at,
        created_by_user_id,
        created_by_system_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
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
    [
      draft.companyId ?? null,
      draft.scope,
      normalizeEmail(draft.recipientEmail),
      draft.recipientRole,
      draft.permissionPreset,
      tokenHash,
      draft.expiresAt || getDefaultInvitationExpiresAt(),
      draft.createdByUserId ?? null,
      draft.createdBySystemUserId ?? null,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("INVITATION_CREATE_FAILED");
  }

  return toInvitationRecord(row);
}

async function listDbInvitations(companyId: string): Promise<InvitationRecord[]> {
  const result = await queryDb<InvitationDbRow>(
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
      WHERE company_id = $1
      ORDER BY created_at DESC
    `,
    [companyId],
  );

  return result.rows.map(toInvitationRecord);
}

async function findDbInvitationByRawToken(rawToken: string): Promise<InvitationRecord | null> {
  const tokenHash = createInvitationTokenHash(rawToken);
  const result = await queryDb<InvitationDbRow>(
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

async function revokeDbInvitation(invitationId: string): Promise<InvitationRecord> {
  const result = await queryDb<InvitationDbRow>(
    `
      UPDATE invitations
         SET status = 'revoked', revoked_at = now(), updated_at = now()
       WHERE id = $1
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
    [invitationId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  return toInvitationRecord(row);
}

export function createInvitationRepository(): InvitationRepository {
  return {
    async createInvitation(draft: InvitationDraft): Promise<InvitationCreateResult> {
      const rawToken = createRawInvitationToken();
      const tokenHash = createInvitationTokenHash(rawToken);
      const invitation = isDatabaseConfigured()
        ? await createDbInvitation(draft, tokenHash)
        : createInvitationRecord(draft, tokenHash);

      if (!isDatabaseConfigured()) {
        inMemoryInvitations.unshift(invitation);
      }

      return {
        invitation,
        rawToken,
        inviteUrl: createInviteUrl(rawToken, draft.scope),
      };
    },

    async listInvitations(companyId: string): Promise<InvitationRecord[]> {
      if (isDatabaseConfigured()) {
        return listDbInvitations(companyId);
      }

      return inMemoryInvitations.filter(
        (invitation) => invitation.companyId === companyId,
      );
    },

    async findInvitationByRawToken(rawToken: string): Promise<InvitationRecord | null> {
      if (isDatabaseConfigured()) {
        return findDbInvitationByRawToken(rawToken);
      }

      const tokenHash = createInvitationTokenHash(rawToken);
      return inMemoryInvitations.find((invitation) => invitation.tokenHash === tokenHash) ?? null;
    },

    async revokeInvitation(invitationId: string): Promise<InvitationRecord> {
      if (isDatabaseConfigured()) {
        return revokeDbInvitation(invitationId);
      }

      const invitation = inMemoryInvitations.find(
        (item) => item.id === invitationId,
      );

      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
      }

      const updated: InvitationRecord = {
        ...invitation,
        status: "revoked",
        revokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const index = inMemoryInvitations.findIndex(
        (item) => item.id === invitationId,
      );
      inMemoryInvitations[index] = updated;

      return updated;
    },
  };
}

export const invitationRepository = createInvitationRepository();
