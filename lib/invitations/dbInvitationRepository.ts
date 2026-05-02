import "server-only";

import { createHash, randomBytes, randomUUID } from "crypto";

import { queryDb } from "@/lib/db/client";

import { getDefaultInvitationExpiresAt } from "./invitationPolicy";
import type {
  InvitationCreateResult,
  InvitationDraft,
  InvitationRecord,
  InvitationRepository,
} from "./invitationTypes";

type InvitationRow = {
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

function createRawInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

function createTokenHash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function createInviteUrl(rawToken: string): string {
  return `/invite/${rawToken}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toInvitationRecord(row: InvitationRow): InvitationRecord {
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
    expiresAt: toIsoString(row.expires_at) ?? getDefaultInvitationExpiresAt(),
    createdByUserId: row.created_by_user_id,
    createdBySystemUserId: row.created_by_system_user_id,
    acceptedUserId: row.accepted_user_id,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function getDuplicatePendingInvitationMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (
    error.message.includes("invitations_pending_unique") ||
    error.message.includes("idx_invitations_pending_unique")
  ) {
    return "PENDING_INVITATION_ALREADY_EXISTS";
  }

  return null;
}

export function createDbInvitationRepository(): InvitationRepository {
  return {
    async createInvitation(
      draft: InvitationDraft,
    ): Promise<InvitationCreateResult> {
      const rawToken = createRawInvitationToken();
      const tokenHash = createTokenHash(rawToken);
      const invitationId = randomUUID();
      const expiresAt = draft.expiresAt || getDefaultInvitationExpiresAt();

      try {
        const result = await queryDb<InvitationRow>(
          `
          INSERT INTO invitations (
            id,
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
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'pending',
            $8,
            $9,
            $10
          )
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
            invitationId,
            draft.companyId,
            draft.scope,
            normalizeEmail(draft.recipientEmail),
            draft.recipientRole,
            draft.permissionPreset,
            tokenHash,
            expiresAt,
            draft.createdByUserId ?? null,
            draft.createdBySystemUserId ?? null,
          ],
        );

        const invitation = result.rows[0];

        if (!invitation) {
          throw new Error("INVITATION_INSERT_FAILED");
        }

        return {
          invitation: toInvitationRecord(invitation),
          rawToken,
          inviteUrl: createInviteUrl(rawToken),
        };
      } catch (error) {
        const duplicateMessage = getDuplicatePendingInvitationMessage(error);

        if (duplicateMessage) {
          throw new Error(duplicateMessage);
        }

        throw error;
      }
    },

    async listInvitations(companyId: string): Promise<InvitationRecord[]> {
      const result = await queryDb<InvitationRow>(
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
    },

    async revokeInvitation(invitationId: string): Promise<InvitationRecord> {
      const result = await queryDb<InvitationRow>(
        `
        UPDATE invitations
        SET
          status = 'revoked',
          revoked_at = now(),
          updated_at = now()
        WHERE id = $1
          AND status = 'pending'
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

      const invitation = result.rows[0];

      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND_OR_NOT_PENDING");
      }

      return toInvitationRecord(invitation);
    },
  };
}
