import type {
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
  InvitationStatus,
} from "./invitationPolicy";

export interface InvitationDraft {
  companyId: string;
  recipientEmail: string;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  scope: InvitationScope;
  expiresAt: string;
}

export interface InvitationRecord {
  id: string;
  companyId: string;
  recipientEmail: string;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  scope: InvitationScope;
  status: InvitationStatus;
  tokenHash: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  expiresAt: string;
  createdByUserId?: string | null;
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
  revokeInvitation(invitationId: string): Promise<InvitationRecord>;
}
