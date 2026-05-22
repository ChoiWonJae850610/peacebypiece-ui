import {
  MEMBER_PERMISSION_CATALOG,
  MEMBER_ROLE_TEMPLATE_POLICIES,
  getAssignableMemberRoleTemplatePolicies,
  toAssignableMemberRoleTemplateCode,
  type MemberPermissionCode,
  type MemberPermissionGroupKey,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import type { AdminCompanyMemberRecord } from "./memberTypes";

export type MemberManagementStatus = "planned" | "ready" | "pending";

export type MemberRolePreviewId = MemberPermissionRoleTemplateCode;

export type MemberRolePreview = {
  id: MemberRolePreviewId;
  permissionCount: number;
  status: MemberManagementStatus;
};

export type MemberPermissionCard = {
  id: string;
  requiredPermissions: readonly MemberPermissionCode[];
  status: MemberManagementStatus;
};

export type MemberPermissionGroupPreview = {
  id: MemberPermissionGroupKey;
  permissionCount: number;
  systemOnlyCount: number;
};

export type MemberPermissionCatalogPreview = {
  code: MemberPermissionCode;
  group: MemberPermissionGroupKey;
  systemOnly: boolean;
};

export type MemberPermissionMatrixPreview = {
  roleId: MemberRolePreviewId;
  permissionCode: MemberPermissionCode;
  enabled: boolean;
};

export type EditableMemberPermissionPreview = {
  code: MemberPermissionCode;
  labelKey: string;
  descriptionKey: string;
};

export type EditableMemberPermissionGroupPreview = {
  id: MemberPermissionGroupKey;
  labelKey: string;
  permissions: readonly EditableMemberPermissionPreview[];
};

export type MemberManagementSummaryCard = {
  id: "activeMembers" | "pendingApprovals" | "inactiveMembers";
  value: string;
  status: MemberManagementStatus;
};

export type MemberManagementTableColumn = {
  id: string;
};

export type MemberJoinRequestEmailMatchStatus = "matched" | "mismatched" | "unknown";

export type MemberJoinRequestLoadStatus = "idle" | "loading" | "loaded" | "failed";
export type MemberListLoadStatus = "idle" | "loading" | "loaded" | "failed";

export type MemberInviteRoleOption = {
  id: MemberRolePreviewId;
  permissionCount: number;
};

export type MemberInvitationSetupCard = {
  id: "link" | "qr" | "approval";
  status: MemberManagementStatus;
};

export type MemberInviteQrPreviewRow = readonly boolean[];

export type MemberListPreview = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: MemberRolePreviewId;
  status: AdminCompanyMemberRecord["status"];
  permissionCount: number;
  permissionCodes: readonly MemberPermissionCode[];
  approvedAtLabel: string;
  lastActiveLabel: string;
};

export type MemberInvitationPreview = {
  id: string;
  targetLabel: string;
  inviteType: "link" | "qr";
  status: "draft" | "active" | "expired";
  expiresLabel: string;
};

export type MemberJoinRequestPreview = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhoneLabel: string;
  requestMemoLabel: string;
  invitationEmailLabel: string;
  emailMatchStatus: MemberJoinRequestEmailMatchStatus;
  requestedRoleId: MemberRolePreviewId;
  status: "pending";
  requestedAtLabel: string;
};

export type MemberApprovalStepPreview = {
  id: "review" | "permission" | "approve" | "audit";
  status: MemberManagementStatus;
};

export type MemberApprovalActionPreview = {
  id: "approve" | "reject" | "permissionUpdate";
  status: MemberManagementStatus;
  requiredPermissions: readonly MemberPermissionCode[];
};

export type MemberApprovalPermissionPreview = {
  code: MemberPermissionCode;
  group: MemberPermissionGroupKey;
  checked: boolean;
};

export const MEMBER_MANAGEMENT_SUMMARY_CARDS: readonly MemberManagementSummaryCard[] = [
  { id: "activeMembers", value: "0", status: "planned" },
  { id: "pendingApprovals", value: "0", status: "planned" },
  { id: "inactiveMembers", value: "0", status: "planned" },
] as const;

export const MEMBER_ROLE_PREVIEWS: readonly MemberRolePreview[] = MEMBER_ROLE_TEMPLATE_POLICIES.map((role) => ({
  id: role.code,
  permissionCount: role.permissionCodes.length,
  status: "ready",
}));

export const MEMBER_ASSIGNABLE_ROLE_PREVIEWS: readonly MemberRolePreview[] =
  getAssignableMemberRoleTemplatePolicies().map((role) => ({
    id: role.code,
    permissionCount: role.permissionCodes.length,
    status: "ready",
  }));

export const MEMBER_MANAGEMENT_PERMISSION_CARDS: readonly MemberPermissionCard[] = [
  { id: "workorder", requiredPermissions: ["workorder.read"], status: "ready" },
  { id: "workflow", requiredPermissions: ["workorder.status.review", "workorder.status.order", "workorder.status.inspect", "workorder.status.complete"], status: "ready" },
  { id: "partners", requiredPermissions: ["partner.read"], status: "ready" },
  { id: "standards", requiredPermissions: ["standards.read"], status: "ready" },
  { id: "storage", requiredPermissions: ["storage.read"], status: "ready" },
  { id: "stats", requiredPermissions: ["stats.read"], status: "ready" },
  { id: "members", requiredPermissions: ["member.read"], status: "ready" },
  { id: "organization-settings", requiredPermissions: ["settings.read"], status: "ready" },
] as const;

export const MEMBER_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "name" },
  { id: "email" },
  { id: "phone" },
  { id: "role" },
  { id: "status" },
  { id: "requestedAt" },
  { id: "approvedAt" },
  { id: "lastActive" },
  { id: "actions" },
] as const;

export const INVITATION_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "target" },
  { id: "type" },
  { id: "status" },
  { id: "expires" },
] as const;

export const JOIN_REQUEST_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "applicant" },
  { id: "contact" },
  { id: "inviteEmail" },
  { id: "emailMatch" },
  { id: "memo" },
  { id: "requestedRole" },
  { id: "status" },
  { id: "requestedAt" },
  { id: "actions" },
] as const;

export const MEMBER_LIST_PREVIEWS: readonly MemberListPreview[] = [] as const;
export const MEMBER_INVITATION_PREVIEWS: readonly MemberInvitationPreview[] = [] as const;
export const MEMBER_JOIN_REQUEST_PREVIEWS: readonly MemberJoinRequestPreview[] = [] as const;

export const MEMBER_INVITE_SETUP_CARDS: readonly MemberInvitationSetupCard[] = [
  { id: "link", status: "ready" },
  { id: "qr", status: "ready" },
  { id: "approval", status: "ready" },
] as const;

export const MEMBER_APPROVAL_STEP_PREVIEWS: readonly MemberApprovalStepPreview[] = [
  { id: "review", status: "ready" },
  { id: "permission", status: "ready" },
  { id: "approve", status: "pending" },
  { id: "audit", status: "planned" },
] as const;

export const MEMBER_APPROVAL_ACTION_PREVIEWS: readonly MemberApprovalActionPreview[] = [
  { id: "approve", status: "ready", requiredPermissions: ["member.approve", "member.permission.update"] },
  { id: "reject", status: "ready", requiredPermissions: ["member.reject"] },
  { id: "permissionUpdate", status: "ready", requiredPermissions: ["member.permission.update"] },
] as const;

export const MEMBER_APPROVAL_PERMISSION_PREVIEWS: readonly MemberApprovalPermissionPreview[] = MEMBER_PERMISSION_CATALOG.filter((permission) =>
  MEMBER_ROLE_TEMPLATE_POLICIES.find((role) => role.code === "designer")?.permissionCodes.includes(permission.code),
).map((permission) => ({
  code: permission.code,
  group: permission.group,
  checked: true,
}));

export const MEMBER_INVITE_QR_PREVIEW_ROWS: readonly MemberInviteQrPreviewRow[] = [
  [true, true, true, false, true, false, true, true, true],
  [true, false, true, false, false, true, true, false, true],
  [true, true, true, true, false, false, true, true, true],
  [false, false, true, false, true, true, false, false, true],
  [true, false, false, true, true, false, true, false, false],
  [false, true, true, false, false, true, false, true, true],
  [true, true, true, false, true, false, true, true, true],
  [true, false, true, true, false, true, true, false, true],
  [true, true, true, false, true, false, true, true, true],
] as const;


function normalizeEmailForCompare(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function isMemberRolePreviewId(value: string | null | undefined): value is MemberRolePreviewId {
  return MEMBER_ROLE_TEMPLATE_POLICIES.some((role) => role.code === value);
}

function toMemberRolePreviewId(value: string | null | undefined): MemberRolePreviewId {
  return toAssignableMemberRoleTemplateCode(value);
}

function resolveRequestedRoleId(joinRequest: JoinRequestRecord): MemberRolePreviewId {
  const permissionPreset = joinRequest.invitation?.permissionPreset;
  if (isMemberRolePreviewId(permissionPreset)) {
    return toAssignableMemberRoleTemplateCode(permissionPreset);
  }
  return toMemberRolePreviewId(joinRequest.invitation?.recipientRole);
}

function toCompactDateTimeLabel(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveEmailMatchStatus(joinRequest: JoinRequestRecord): MemberJoinRequestEmailMatchStatus {
  const applicantEmail = normalizeEmailForCompare(joinRequest.applicantEmail);
  const invitationEmail = normalizeEmailForCompare(joinRequest.invitation?.recipientEmail);

  if (!applicantEmail || !invitationEmail) return "unknown";
  return applicantEmail === invitationEmail ? "matched" : "mismatched";
}


function toRelativeDateLabel(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return toCompactDateTimeLabel(value);
}

export function toMemberListPreview(member: AdminCompanyMemberRecord): MemberListPreview {
  return {
    id: member.id,
    name: member.name,
    email: member.email?.trim() || "-",
    phone: member.phone?.trim() || "-",
    roleId: toAssignableMemberRoleTemplateCode(member.roleTemplateCode),
    status: member.status,
    permissionCount: member.permissionCount,
    permissionCodes: member.permissionCodes,
    approvedAtLabel: toCompactDateTimeLabel(member.approvedAt),
    lastActiveLabel: toCompactDateTimeLabel(member.lastActiveAt),
  };
}

export function toMemberListPreviews(members: readonly AdminCompanyMemberRecord[]): readonly MemberListPreview[] {
  return members.map(toMemberListPreview);
}

export function toMemberJoinRequestPreview(joinRequest: JoinRequestRecord): MemberJoinRequestPreview {
  return {
    id: joinRequest.id,
    applicantName: joinRequest.applicantName?.trim() || "-",
    applicantEmail: joinRequest.applicantEmail,
    applicantPhoneLabel: joinRequest.applicantPhone?.trim() || "-",
    requestMemoLabel: joinRequest.requestMemo?.trim() || "-",
    invitationEmailLabel: joinRequest.invitation?.recipientEmail?.trim() || "-",
    emailMatchStatus: resolveEmailMatchStatus(joinRequest),
    requestedRoleId: resolveRequestedRoleId(joinRequest),
    status: "pending",
    requestedAtLabel: toCompactDateTimeLabel(joinRequest.createdAt),
  };
}

export function toMemberJoinRequestPreviews(joinRequests: readonly JoinRequestRecord[]): readonly MemberJoinRequestPreview[] {
  return joinRequests
    .filter((joinRequest) => joinRequest.requestType === "member" && joinRequest.status === "pending")
    .map(toMemberJoinRequestPreview);
}

export function getMemberManagementSummaryCards(): readonly MemberManagementSummaryCard[] {
  return MEMBER_MANAGEMENT_SUMMARY_CARDS;
}

export function getMemberRolePreviews(): readonly MemberRolePreview[] {
  return MEMBER_ROLE_PREVIEWS;
}

export function getAssignableMemberRolePreviews(): readonly MemberRolePreview[] {
  return MEMBER_ASSIGNABLE_ROLE_PREVIEWS;
}

export function getMemberInviteRoleOptions(): readonly MemberInviteRoleOption[] {
  return MEMBER_ASSIGNABLE_ROLE_PREVIEWS.map((role) => ({
    id: role.id,
    permissionCount: role.permissionCount,
  }));
}

export function getMemberInvitationSetupCards(): readonly MemberInvitationSetupCard[] {
  return MEMBER_INVITE_SETUP_CARDS;
}

export function getMemberInviteQrPreviewRows(): readonly MemberInviteQrPreviewRow[] {
  return MEMBER_INVITE_QR_PREVIEW_ROWS;
}


export function getMemberApprovalStepPreviews(): readonly MemberApprovalStepPreview[] {
  return MEMBER_APPROVAL_STEP_PREVIEWS;
}

export function getMemberApprovalActionPreviews(): readonly MemberApprovalActionPreview[] {
  return MEMBER_APPROVAL_ACTION_PREVIEWS;
}

export function getMemberApprovalPermissionPreviews(): readonly MemberApprovalPermissionPreview[] {
  return MEMBER_APPROVAL_PERMISSION_PREVIEWS;
}

export function getMemberManagementPermissionCards(): readonly MemberPermissionCard[] {
  return MEMBER_MANAGEMENT_PERMISSION_CARDS;
}

export function getMemberPermissionGroupPreviews(): readonly MemberPermissionGroupPreview[] {
  const groups = Array.from(new Set(MEMBER_PERMISSION_CATALOG.map((item) => item.group)));
  return groups.map((group) => {
    const permissions = MEMBER_PERMISSION_CATALOG.filter((item) => item.group === group);
    return {
      id: group,
      permissionCount: permissions.length,
      systemOnlyCount: permissions.filter((item) => item.systemOnly).length,
    };
  });
}

export function getMemberPermissionCatalogPreviews(): readonly MemberPermissionCatalogPreview[] {
  return MEMBER_PERMISSION_CATALOG.map((item) => ({ code: item.code, group: item.group, systemOnly: item.systemOnly }));
}

export function getMemberPermissionMatrixPreviews(): readonly MemberPermissionMatrixPreview[] {
  return MEMBER_ROLE_TEMPLATE_POLICIES.flatMap((role) =>
    MEMBER_PERMISSION_CATALOG.filter((permission) => !permission.systemOnly).map((permission) => ({
      roleId: role.code,
      permissionCode: permission.code,
      enabled: role.permissionCodes.includes(permission.code),
    })),
  );
}

const HIDDEN_EDITABLE_MEMBER_PERMISSION_CODES: readonly MemberPermissionCode[] = [
  "partner.manage",
  "standards.manage",
] as const;

export function getEditableMemberPermissionGroupPreviews(): readonly EditableMemberPermissionGroupPreview[] {
  const editablePermissions = MEMBER_PERMISSION_CATALOG.filter(
    (permission) =>
      !permission.systemOnly &&
      !HIDDEN_EDITABLE_MEMBER_PERMISSION_CODES.includes(permission.code),
  );
  const groupIds = Array.from(new Set(editablePermissions.map((permission) => permission.group)));

  return groupIds.map((groupId) => ({
    id: groupId,
    labelKey: `memberManagement.permissionGroups.${groupId}.label`,
    permissions: editablePermissions
      .filter((permission) => permission.group === groupId)
      .map((permission) => ({
        code: permission.code,
        labelKey: permission.labelKey,
        descriptionKey: permission.descriptionKey,
      })),
  }));
}

export function getMemberTableColumns(): readonly MemberManagementTableColumn[] {
  return MEMBER_TABLE_COLUMNS;
}

export function getInvitationTableColumns(): readonly MemberManagementTableColumn[] {
  return INVITATION_TABLE_COLUMNS;
}

export function getJoinRequestTableColumns(): readonly MemberManagementTableColumn[] {
  return JOIN_REQUEST_TABLE_COLUMNS;
}

export function getMemberListPreviews(): readonly MemberListPreview[] {
  return MEMBER_LIST_PREVIEWS;
}

export function getMemberInvitationPreviews(): readonly MemberInvitationPreview[] {
  return MEMBER_INVITATION_PREVIEWS;
}

export function getMemberJoinRequestPreviews(): readonly MemberJoinRequestPreview[] {
  return MEMBER_JOIN_REQUEST_PREVIEWS;
}
