export type InvitationScope = "system_to_company_admin" | "company_to_member";

export type InvitationStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "expired"
  | "revoked";

export type InvitationRecipientRole =
  | "admin"
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer";

export type InvitationPermissionPreset =
  | "company_admin"
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer"
  | "custom";

export interface InvitationPolicyInput {
  scope: InvitationScope;
  companyId?: string | null;
  inviterCompanyId?: string | null;
  recipientEmail?: string | null;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  expiresAt?: string | null;
  now?: string | null;
}

export interface InvitationPolicyResult {
  canCreate: boolean;
  reasons: string[];
}

export const INVITATION_TOKEN_RAW_VALUE_POLICY =
  "raw token is returned only once and must never be stored in DB" as const;

export const DEFAULT_INVITATION_EXPIRES_IN_DAYS = 7;

const SYSTEM_ALLOWED_ROLES: InvitationRecipientRole[] = ["admin"];

const COMPANY_ALLOWED_ROLES: InvitationRecipientRole[] = [
  "designer",
  "inspector",
  "inventory_manager",
  "viewer",
];

function hasEmailValue(email?: string | null): boolean {
  return Boolean(email?.trim());
}

function isExpired(expiresAt?: string | null, now?: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  const nowTime = now ? new Date(now).getTime() : Date.now();

  if (Number.isNaN(expiresAtTime) || Number.isNaN(nowTime)) {
    return false;
  }

  return expiresAtTime <= nowTime;
}

export function evaluateInvitationPolicy(
  input: InvitationPolicyInput,
): InvitationPolicyResult {
  const reasons: string[] = [];

  if (!hasEmailValue(input.recipientEmail)) {
    reasons.push("recipient_email_required");
  }

  if (isExpired(input.expiresAt, input.now)) {
    reasons.push("invitation_already_expired");
  }

  if (input.scope === "system_to_company_admin") {
    if (!input.companyId) {
      reasons.push("company_id_required");
    }

    if (!SYSTEM_ALLOWED_ROLES.includes(input.recipientRole)) {
      reasons.push("system_invitation_allows_company_admin_only");
    }

    if (input.permissionPreset !== "company_admin") {
      reasons.push("system_invitation_requires_company_admin_preset");
    }
  }

  if (input.scope === "company_to_member") {
    if (!input.inviterCompanyId) {
      reasons.push("inviter_company_id_required");
    }

    if (input.companyId && input.companyId !== input.inviterCompanyId) {
      reasons.push("cross_company_invitation_forbidden");
    }

    if (!COMPANY_ALLOWED_ROLES.includes(input.recipientRole)) {
      reasons.push("company_invitation_role_not_allowed");
    }

    if (
      input.permissionPreset !== "custom" &&
      input.permissionPreset !== input.recipientRole
    ) {
      reasons.push("permission_preset_role_mismatch");
    }
  }

  return {
    canCreate: reasons.length === 0,
    reasons,
  };
}

export function getDefaultInvitationExpiresAt(now = new Date()): string {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_INVITATION_EXPIRES_IN_DAYS);
  return expiresAt.toISOString();
}
