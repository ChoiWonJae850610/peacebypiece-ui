import type {
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
  InvitationStatus,
} from "./invitationPolicy";

export type {
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
  InvitationStatus,
};

export interface InvitationDraft {
  companyId: string | null;
  inviterCompanyId?: string | null;
  recipientEmail: string | null;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  scope: InvitationScope;
  expiresAt: string;
  createdByUserId?: string | null;
  createdBySystemUserId?: string | null;
}

export interface InvitationRecord {
  id: string;
  companyId: string | null;
  companyName?: string | null;
  recipientEmail: string | null;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  scope: InvitationScope;
  status: InvitationStatus;
  tokenHash: string;
  inviteUrlPath?: string | null;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  expiresAt: string;
  createdByUserId?: string | null;
  createdBySystemUserId?: string | null;
  acceptedUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationCreateResult {
  invitation: InvitationRecord;
  rawToken: string;
  inviteUrl: string;
}

export interface InvitationRepository {
  createInvitation(draft: InvitationDraft): Promise<InvitationCreateResult>;
  listInvitations(companyId: string): Promise<InvitationRecord[]>;
  listSystemCompanyAdminInvitations(): Promise<InvitationRecord[]>;
  revokeInvitation(invitationId: string): Promise<InvitationRecord>;
  findInvitationByRawToken(rawToken: string): Promise<InvitationRecord | null>;
}
