import {
  ADMIN_WORKSPACE_PERMISSIONS,
  MEMBER_PERMISSION_CATALOG,
  MEMBER_ROLE_TEMPLATE_POLICIES,
  type MemberPermissionCode,
  type MemberPermissionGroupKey,
  type MemberPermissionRoleTemplateCode,
  type Permission,
} from "@/lib/permissions";

export type MemberManagementStatus = "planned" | "ready" | "pending";

export type MemberRolePreviewId = MemberPermissionRoleTemplateCode;

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

export type MemberManagementSummaryCard = {
  id: "members" | "invitations" | "joinRequests" | "permissionTemplates";
  value: string;
  status: MemberManagementStatus;
};

export type MemberManagementTableColumn = {
  id: string;
};

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
  { id: "permissionTemplates", value: String(MEMBER_ROLE_TEMPLATE_POLICIES.length), status: "ready" },
] as const;

export const MEMBER_ROLE_PREVIEWS: readonly MemberRolePreview[] = MEMBER_ROLE_TEMPLATE_POLICIES.map((role) => ({
  id: role.code,
  permissionCount: role.permissionCodes.length,
  status: "ready",
}));

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

export const MEMBER_INVITE_SETUP_CARDS: readonly MemberInvitationSetupCard[] = [
  { id: "link", status: "ready" },
  { id: "qr", status: "ready" },
  { id: "approval", status: "pending" },
] as const;

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

export function getMemberManagementSummaryCards(): readonly MemberManagementSummaryCard[] {
  return MEMBER_MANAGEMENT_SUMMARY_CARDS;
}

export function getMemberRolePreviews(): readonly MemberRolePreview[] {
  return MEMBER_ROLE_PREVIEWS;
}

export function getMemberInviteRoleOptions(): readonly MemberInviteRoleOption[] {
  return MEMBER_ROLE_PREVIEWS.map((role) => ({ id: role.id, permissionCount: role.permissionCount }));
}

export function getMemberInvitationSetupCards(): readonly MemberInvitationSetupCard[] {
  return MEMBER_INVITE_SETUP_CARDS;
}

export function getMemberInviteQrPreviewRows(): readonly MemberInviteQrPreviewRow[] {
  return MEMBER_INVITE_QR_PREVIEW_ROWS;
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
