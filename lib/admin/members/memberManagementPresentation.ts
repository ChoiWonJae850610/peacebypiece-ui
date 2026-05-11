import {
  ADMIN_WORKSPACE_PERMISSIONS,
  DEFAULT_PERMISSION_PROFILES,
  PERMISSION_GROUPS,
  type Permission,
  type PermissionRole,
} from "@/lib/permissions";

export type MemberManagementStatus = "planned" | "ready" | "pending";

export type MemberRolePreviewId = PermissionRole | "viewer";

export type MemberRolePreview = {
  id: MemberRolePreviewId;
  permissionCount: number;
  status: MemberManagementStatus;
};

export type MemberPermissionCard = {
  id: string;
  permission: Permission;
  status: MemberManagementStatus;
};

export type MemberPermissionGroupPreview = {
  id: string;
  permissionCount: number;
};

export type MemberManagementSummaryCard = {
  id: "members" | "invitations" | "joinRequests" | "permissionTemplates";
  value: string;
  status: MemberManagementStatus;
};

export type MemberManagementTableColumn = {
  id: string;
};

export type MemberListPreview = {
  id: string;
  name: string;
  email: string;
  roleId: MemberRolePreviewId;
  status: "approved" | "pending" | "suspended";
  permissionCount: number;
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
  requestedRoleId: MemberRolePreviewId;
  status: "pending";
  requestedAtLabel: string;
};

export const MEMBER_MANAGEMENT_SUMMARY_CARDS: readonly MemberManagementSummaryCard[] = [
  { id: "members", value: "0", status: "planned" },
  { id: "invitations", value: "0", status: "planned" },
  { id: "joinRequests", value: "0", status: "planned" },
  { id: "permissionTemplates", value: "4", status: "ready" },
] as const;

export const MEMBER_ROLE_PREVIEWS: readonly MemberRolePreview[] = [
  { id: "admin", permissionCount: DEFAULT_PERMISSION_PROFILES.admin.permissions.length, status: "ready" },
  { id: "designer", permissionCount: DEFAULT_PERMISSION_PROFILES.designer.permissions.length, status: "ready" },
  { id: "inspector", permissionCount: DEFAULT_PERMISSION_PROFILES.inspector.permissions.length, status: "ready" },
  { id: "inventory", permissionCount: DEFAULT_PERMISSION_PROFILES.inventory.permissions.length, status: "ready" },
  { id: "viewer", permissionCount: 2, status: "planned" },
] as const;

export const MEMBER_MANAGEMENT_PERMISSION_CARDS: readonly MemberPermissionCard[] = [
  { id: "workorder", permission: ADMIN_WORKSPACE_PERMISSIONS.workorderAccess, status: "ready" },
  { id: "partners", permission: ADMIN_WORKSPACE_PERMISSIONS.partnerManage, status: "planned" },
  { id: "storage", permission: ADMIN_WORKSPACE_PERMISSIONS.storageManage, status: "planned" },
  { id: "stats", permission: ADMIN_WORKSPACE_PERMISSIONS.statsView, status: "planned" },
  { id: "members", permission: ADMIN_WORKSPACE_PERMISSIONS.memberManage, status: "planned" },
  { id: "organization-settings", permission: ADMIN_WORKSPACE_PERMISSIONS.organizationSettingsManage, status: "planned" },
  { id: "standard-units", permission: ADMIN_WORKSPACE_PERMISSIONS.standardUnitManage, status: "planned" },
  { id: "outsourcing-processes", permission: ADMIN_WORKSPACE_PERMISSIONS.outsourcingProcessManage, status: "planned" },
  { id: "product-types", permission: ADMIN_WORKSPACE_PERMISSIONS.productTypeManage, status: "planned" },
] as const;

export const MEMBER_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "member" },
  { id: "role" },
  { id: "status" },
  { id: "permissions" },
  { id: "lastActive" },
] as const;

export const INVITATION_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "target" },
  { id: "type" },
  { id: "status" },
  { id: "expires" },
] as const;

export const JOIN_REQUEST_TABLE_COLUMNS: readonly MemberManagementTableColumn[] = [
  { id: "applicant" },
  { id: "requestedRole" },
  { id: "status" },
  { id: "requestedAt" },
] as const;

export const MEMBER_LIST_PREVIEWS: readonly MemberListPreview[] = [] as const;
export const MEMBER_INVITATION_PREVIEWS: readonly MemberInvitationPreview[] = [] as const;
export const MEMBER_JOIN_REQUEST_PREVIEWS: readonly MemberJoinRequestPreview[] = [] as const;

export function getMemberManagementSummaryCards(): readonly MemberManagementSummaryCard[] {
  return MEMBER_MANAGEMENT_SUMMARY_CARDS;
}

export function getMemberRolePreviews(): readonly MemberRolePreview[] {
  return MEMBER_ROLE_PREVIEWS;
}

export function getMemberManagementPermissionCards(): readonly MemberPermissionCard[] {
  return MEMBER_MANAGEMENT_PERMISSION_CARDS;
}

export function getMemberPermissionGroupPreviews(): readonly MemberPermissionGroupPreview[] {
  return PERMISSION_GROUPS.map((group) => ({ id: group.key, permissionCount: group.permissions.length }));
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
