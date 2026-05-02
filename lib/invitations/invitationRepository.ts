import { createHash, randomBytes, randomUUID } from "crypto";

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

function createTokenHash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function createInviteUrl(rawToken: string): string {
  return `/invite/${rawToken}`;
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
    companyId: draft.companyId,
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

export function createInvitationRepository(): InvitationRepository {
  return {
    async createInvitation(
      draft: InvitationDraft,
    ): Promise<InvitationCreateResult> {
      const rawToken = createRawInvitationToken();
      const tokenHash = createTokenHash(rawToken);
      const invitation = createInvitationRecord(draft, tokenHash);

      inMemoryInvitations.unshift(invitation);

      return {
        invitation,
        rawToken,
        inviteUrl: createInviteUrl(rawToken),
      };
    },

    async listInvitations(companyId: string): Promise<InvitationRecord[]> {
      return inMemoryInvitations.filter(
        (invitation) => invitation.companyId === companyId,
      );
    },

    async revokeInvitation(invitationId: string): Promise<InvitationRecord> {
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
