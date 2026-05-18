import { createHash, randomBytes, randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { DEV_SYSTEM_ADMIN_EMAIL, DEV_SYSTEM_ADMIN_NAME, DEV_SYSTEM_ADMIN_USER_ID } from "@/lib/system/devSystemAdmin";
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

function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

function createInvitationRecord(
  draft: InvitationDraft,
  tokenHash: string,
  inviteUrlPath: string,
): InvitationRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    companyId: draft.companyId ?? null,
    companyName: null,
    recipientEmail: draft.scope === "system_to_company_admin" ? null : normalizeEmail(draft.recipientEmail),
    recipientRole: draft.recipientRole,
    permissionPreset: draft.permissionPreset,
    scope: draft.scope,
    status: "pending",
    tokenHash,
    inviteUrlPath,
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
  recipient_email: string | null;
  company_name?: string | null;
  recipient_role: InvitationRecord["recipientRole"];
  permission_preset: InvitationRecord["permissionPreset"];
  scope: InvitationRecord["scope"];
  status: InvitationRecord["status"];
  token_hash: string;
  invite_url_path: string | null;
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
    companyName: row.company_name ?? null,
    recipientEmail: row.recipient_email,
    recipientRole: row.recipient_role,
    permissionPreset: row.permission_preset,
    scope: row.scope,
    status: row.status,
    tokenHash: row.token_hash,
    inviteUrlPath: row.invite_url_path,
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


async function ensureSystemInvitationCreator(draft: InvitationDraft): Promise<void> {
  if (draft.scope !== "system_to_company_admin") return;
  if (draft.createdBySystemUserId !== DEV_SYSTEM_ADMIN_USER_ID) return;

  await queryDb(
    `
      INSERT INTO system_users (id, email, name, role, is_active)
      VALUES ($1::text, $2::text, $3::text, 'system_admin', true)
      ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             role = 'system_admin',
             is_active = true,
             updated_at = now()
    `,
    [DEV_SYSTEM_ADMIN_USER_ID, DEV_SYSTEM_ADMIN_EMAIL, DEV_SYSTEM_ADMIN_NAME],
  );
}

async function createDbInvitation(draft: InvitationDraft, tokenHash: string, inviteUrlPath: string): Promise<InvitationRecord> {
  await ensureSystemInvitationCreator(draft);

  const result = await queryDb<InvitationDbRow>(
    `
      INSERT INTO invitations (
        company_id,
        scope,
        recipient_email,
        recipient_role,
        permission_preset,
        token_hash,
        invite_url_path,
        status,
        expires_at,
        created_by_user_id,
        created_by_system_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
      RETURNING
        id,
        company_id,
        recipient_email,
        recipient_role,
        permission_preset,
        scope,
        status,
        token_hash,
        invite_url_path,
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
      draft.scope === "system_to_company_admin" ? null : normalizeEmail(draft.recipientEmail),
      draft.recipientRole,
      draft.permissionPreset,
      tokenHash,
      inviteUrlPath,
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
        company_name,
        recipient_role,
        permission_preset,
        scope,
        status,
        token_hash,
        invite_url_path,
        accepted_at,
        revoked_at,
        expires_at,
        created_by_user_id,
        created_by_system_user_id,
        accepted_user_id,
        created_at,
        updated_at
      FROM (
        SELECT invitations.*, companies.name AS company_name
          FROM invitations
          LEFT JOIN companies ON companies.id = invitations.company_id
      ) invitations
      WHERE company_id = $1
      ORDER BY created_at DESC
    `,
    [companyId],
  );

  return result.rows.map(toInvitationRecord);
}


async function listDbSystemCompanyAdminInvitations(): Promise<InvitationRecord[]> {
  const result = await queryDb<InvitationDbRow>(
    `
      SELECT
        id,
        company_id,
        recipient_email,
        company_name,
        recipient_role,
        permission_preset,
        scope,
        status,
        token_hash,
        invite_url_path,
        accepted_at,
        revoked_at,
        expires_at,
        created_by_user_id,
        created_by_system_user_id,
        accepted_user_id,
        created_at,
        updated_at
      FROM (
        SELECT invitations.*, companies.name AS company_name
          FROM invitations
          LEFT JOIN companies ON companies.id = invitations.company_id
      ) invitations
      WHERE scope = 'system_to_company_admin'
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [],
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
        company_name,
        recipient_role,
        permission_preset,
        scope,
        status,
        token_hash,
        invite_url_path,
        accepted_at,
        revoked_at,
        expires_at,
        created_by_user_id,
        created_by_system_user_id,
        accepted_user_id,
        created_at,
        updated_at
      FROM (
        SELECT invitations.*, companies.name AS company_name
          FROM invitations
          LEFT JOIN companies ON companies.id = invitations.company_id
      ) invitations
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
        invite_url_path,
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
      const inviteUrlPath = createInviteUrl(rawToken, draft.scope);
      const invitation = isDatabaseConfigured()
        ? await createDbInvitation(draft, tokenHash, inviteUrlPath)
        : createInvitationRecord(draft, tokenHash, inviteUrlPath);

      if (!isDatabaseConfigured()) {
        inMemoryInvitations.unshift(invitation);
      }

      return {
        invitation,
        rawToken,
        inviteUrl: inviteUrlPath,
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

    async listSystemCompanyAdminInvitations(): Promise<InvitationRecord[]> {
      if (isDatabaseConfigured()) {
        return listDbSystemCompanyAdminInvitations();
      }

      return inMemoryInvitations
        .filter((invitation) => invitation.scope === "system_to_company_admin")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
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
