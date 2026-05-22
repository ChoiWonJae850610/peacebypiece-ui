export type MemberPermissionGroupKey =
  | "workorder"
  | "workflow"
  | "partner"
  | "standards"
  | "storage"
  | "stats"
  | "settings"
  | "member"
  | "audit"
  | "personal"
  | "system";

export type MemberPermissionRoleTemplateCode =
  | "company_admin"
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer";

export type MemberPermissionCode =
  | "workorder.read"
  | "workorder.create"
  | "workorder.update"
  | "workorder.delete"
  | "workorder.restore"
  | "workorder.status.review"
  | "workorder.status.order"
  | "workorder.status.inspect"
  | "workorder.status.complete"
  | "partner.read"
  | "partner.create"
  | "partner.update"
  | "partner.delete"
  | "partner.manage"
  | "storage.read"
  | "storage.delete.request"
  | "storage.restore"
  | "stats.read"
  | "settings.read"
  | "settings.manage"
  | "standards.read"
  | "standards.create"
  | "standards.update"
  | "standards.delete"
  | "standards.manage"
  | "member.read"
  | "member.invite"
  | "member.approve"
  | "member.reject"
  | "member.permission.update"
  | "member.suspend"
  | "audit.read.company"
  | "personal_settings.manage"
  | "system.standard.manage"
  | "system.company.invite"
  | "system.company.approve";

export type MemberPermissionCatalogItem = {
  code: MemberPermissionCode;
  group: MemberPermissionGroupKey;
  labelKey: string;
  descriptionKey: string;
  systemOnly: boolean;
  sortOrder: number;
};

export type MemberRoleTemplatePolicy = {
  code: MemberPermissionRoleTemplateCode;
  labelKey: string;
  descriptionKey: string;
  sortOrder: number;
  permissionCodes: readonly MemberPermissionCode[];
};

export type MemberPermissionMatrixRow = {
  roleCode: MemberPermissionRoleTemplateCode;
  permissionCode: MemberPermissionCode;
  enabled: boolean;
};

export const MEMBER_PERMISSION_CATALOG: readonly MemberPermissionCatalogItem[] = [
  { code: "workorder.read", group: "workorder", labelKey: "permissions.workorder.read.label", descriptionKey: "permissions.workorder.read.description", systemOnly: false, sortOrder: 10 },
  { code: "workorder.create", group: "workorder", labelKey: "permissions.workorder.create.label", descriptionKey: "permissions.workorder.create.description", systemOnly: false, sortOrder: 20 },
  { code: "workorder.update", group: "workorder", labelKey: "permissions.workorder.update.label", descriptionKey: "permissions.workorder.update.description", systemOnly: false, sortOrder: 30 },
  { code: "workorder.delete", group: "workorder", labelKey: "permissions.workorder.delete.label", descriptionKey: "permissions.workorder.delete.description", systemOnly: false, sortOrder: 40 },
  { code: "workorder.restore", group: "workorder", labelKey: "permissions.workorder.restore.label", descriptionKey: "permissions.workorder.restore.description", systemOnly: false, sortOrder: 50 },
  { code: "workorder.status.review", group: "workflow", labelKey: "permissions.workorder.statusReview.label", descriptionKey: "permissions.workorder.statusReview.description", systemOnly: false, sortOrder: 60 },
  { code: "workorder.status.order", group: "workflow", labelKey: "permissions.workorder.statusOrder.label", descriptionKey: "permissions.workorder.statusOrder.description", systemOnly: false, sortOrder: 70 },
  { code: "workorder.status.inspect", group: "workflow", labelKey: "permissions.workorder.statusInspect.label", descriptionKey: "permissions.workorder.statusInspect.description", systemOnly: false, sortOrder: 80 },
  { code: "workorder.status.complete", group: "workflow", labelKey: "permissions.workorder.statusComplete.label", descriptionKey: "permissions.workorder.statusComplete.description", systemOnly: false, sortOrder: 90 },
  { code: "partner.read", group: "partner", labelKey: "permissions.partner.read.label", descriptionKey: "permissions.partner.read.description", systemOnly: false, sortOrder: 110 },
  { code: "partner.create", group: "partner", labelKey: "permissions.partner.create.label", descriptionKey: "permissions.partner.create.description", systemOnly: false, sortOrder: 120 },
  { code: "partner.update", group: "partner", labelKey: "permissions.partner.update.label", descriptionKey: "permissions.partner.update.description", systemOnly: false, sortOrder: 130 },
  { code: "partner.delete", group: "partner", labelKey: "permissions.partner.delete.label", descriptionKey: "permissions.partner.delete.description", systemOnly: false, sortOrder: 140 },
  { code: "partner.manage", group: "partner", labelKey: "permissions.partner.manage.label", descriptionKey: "permissions.partner.manage.description", systemOnly: false, sortOrder: 145 },
  { code: "storage.read", group: "storage", labelKey: "permissions.storage.read.label", descriptionKey: "permissions.storage.read.description", systemOnly: false, sortOrder: 130 },
  { code: "storage.delete.request", group: "storage", labelKey: "permissions.storage.deleteRequest.label", descriptionKey: "permissions.storage.deleteRequest.description", systemOnly: false, sortOrder: 140 },
  { code: "storage.restore", group: "storage", labelKey: "permissions.storage.restore.label", descriptionKey: "permissions.storage.restore.description", systemOnly: false, sortOrder: 150 },
  { code: "stats.read", group: "stats", labelKey: "permissions.stats.read.label", descriptionKey: "permissions.stats.read.description", systemOnly: false, sortOrder: 160 },
  { code: "settings.read", group: "settings", labelKey: "permissions.settings.read.label", descriptionKey: "permissions.settings.read.description", systemOnly: false, sortOrder: 170 },
  { code: "settings.manage", group: "settings", labelKey: "permissions.settings.manage.label", descriptionKey: "permissions.settings.manage.description", systemOnly: false, sortOrder: 180 },
  { code: "standards.read", group: "standards", labelKey: "permissions.standards.read.label", descriptionKey: "permissions.standards.read.description", systemOnly: false, sortOrder: 190 },
  { code: "standards.create", group: "standards", labelKey: "permissions.standards.create.label", descriptionKey: "permissions.standards.create.description", systemOnly: false, sortOrder: 200 },
  { code: "standards.update", group: "standards", labelKey: "permissions.standards.update.label", descriptionKey: "permissions.standards.update.description", systemOnly: false, sortOrder: 210 },
  { code: "standards.delete", group: "standards", labelKey: "permissions.standards.delete.label", descriptionKey: "permissions.standards.delete.description", systemOnly: false, sortOrder: 220 },
  { code: "standards.manage", group: "standards", labelKey: "permissions.standards.manage.label", descriptionKey: "permissions.standards.manage.description", systemOnly: false, sortOrder: 225 },
  { code: "member.read", group: "member", labelKey: "permissions.member.read.label", descriptionKey: "permissions.member.read.description", systemOnly: false, sortOrder: 200 },
  { code: "member.invite", group: "member", labelKey: "permissions.member.invite.label", descriptionKey: "permissions.member.invite.description", systemOnly: false, sortOrder: 210 },
  { code: "member.approve", group: "member", labelKey: "permissions.member.approve.label", descriptionKey: "permissions.member.approve.description", systemOnly: false, sortOrder: 220 },
  { code: "member.reject", group: "member", labelKey: "permissions.member.reject.label", descriptionKey: "permissions.member.reject.description", systemOnly: false, sortOrder: 230 },
  { code: "member.permission.update", group: "member", labelKey: "permissions.member.permissionUpdate.label", descriptionKey: "permissions.member.permissionUpdate.description", systemOnly: false, sortOrder: 240 },
  { code: "member.suspend", group: "member", labelKey: "permissions.member.suspend.label", descriptionKey: "permissions.member.suspend.description", systemOnly: false, sortOrder: 250 },
  { code: "audit.read.company", group: "audit", labelKey: "permissions.audit.readCompany.label", descriptionKey: "permissions.audit.readCompany.description", systemOnly: false, sortOrder: 260 },
  { code: "personal_settings.manage", group: "personal", labelKey: "permissions.personalSettings.manage.label", descriptionKey: "permissions.personalSettings.manage.description", systemOnly: false, sortOrder: 270 },
  { code: "system.standard.manage", group: "system", labelKey: "permissions.system.standardManage.label", descriptionKey: "permissions.system.standardManage.description", systemOnly: true, sortOrder: 1000 },
  { code: "system.company.invite", group: "system", labelKey: "permissions.system.companyInvite.label", descriptionKey: "permissions.system.companyInvite.description", systemOnly: true, sortOrder: 1010 },
  { code: "system.company.approve", group: "system", labelKey: "permissions.system.companyApprove.label", descriptionKey: "permissions.system.companyApprove.description", systemOnly: true, sortOrder: 1020 },
] as const;

export const MEMBER_ROLE_TEMPLATE_POLICIES: readonly MemberRoleTemplatePolicy[] = [
  {
    code: "company_admin",
    labelKey: "memberManagement.roles.companyAdmin.label",
    descriptionKey: "memberManagement.roles.companyAdmin.description",
    sortOrder: 10,
    permissionCodes: MEMBER_PERMISSION_CATALOG.filter((item) => !item.systemOnly).map((item) => item.code),
  },
  {
    code: "designer",
    labelKey: "memberManagement.roles.designer.label",
    descriptionKey: "memberManagement.roles.designer.description",
    sortOrder: 20,
    permissionCodes: ["workorder.read", "workorder.create", "workorder.update", "workorder.delete", "workorder.status.review", "partner.read", "standards.read", "storage.read", "stats.read", "personal_settings.manage"],
  },
  {
    code: "inspector",
    labelKey: "memberManagement.roles.inspector.label",
    descriptionKey: "memberManagement.roles.inspector.description",
    sortOrder: 30,
    permissionCodes: ["workorder.read", "partner.read", "standards.read", "storage.read", "stats.read", "personal_settings.manage"],
  },
  {
    code: "inventory_manager",
    labelKey: "memberManagement.roles.inventoryManager.label",
    descriptionKey: "memberManagement.roles.inventoryManager.description",
    sortOrder: 40,
    permissionCodes: ["workorder.read", "partner.read", "partner.create", "partner.update", "partner.delete", "partner.manage", "standards.read", "standards.create", "standards.update", "standards.delete", "standards.manage", "storage.read", "stats.read", "personal_settings.manage"],
  },
  {
    code: "viewer",
    labelKey: "memberManagement.roles.viewer.label",
    descriptionKey: "memberManagement.roles.viewer.description",
    sortOrder: 50,
    permissionCodes: ["workorder.read", "partner.read", "standards.read", "personal_settings.manage"],
  },
] as const;


export const MEMBER_ASSIGNABLE_ROLE_TEMPLATE_CODES = [
  "designer",
  "inspector",
  "inventory_manager",
] as const satisfies readonly MemberPermissionRoleTemplateCode[];

export type AssignableMemberPermissionRoleTemplateCode =
  (typeof MEMBER_ASSIGNABLE_ROLE_TEMPLATE_CODES)[number];

export function isAssignableMemberRoleTemplateCode(
  value: string | null | undefined,
): value is AssignableMemberPermissionRoleTemplateCode {
  return MEMBER_ASSIGNABLE_ROLE_TEMPLATE_CODES.some((roleCode) => roleCode === value);
}

export function toAssignableMemberRoleTemplateCode(
  value: string | null | undefined,
): AssignableMemberPermissionRoleTemplateCode {
  return isAssignableMemberRoleTemplateCode(value) ? value : "designer";
}

export function getAssignableMemberRoleTemplatePolicies(): readonly MemberRoleTemplatePolicy[] {
  return MEMBER_ROLE_TEMPLATE_POLICIES.filter((role) =>
    isAssignableMemberRoleTemplateCode(role.code),
  );
}

export const MEMBER_PERMISSION_MATRIX_ROWS: readonly MemberPermissionMatrixRow[] = MEMBER_ROLE_TEMPLATE_POLICIES.flatMap((role) =>
  MEMBER_PERMISSION_CATALOG.filter((permission) => !permission.systemOnly).map((permission) => ({
    roleCode: role.code,
    permissionCode: permission.code,
    enabled: role.permissionCodes.includes(permission.code),
  })),
);

export function getMemberPermissionCatalogByGroup(group: MemberPermissionGroupKey): readonly MemberPermissionCatalogItem[] {
  return MEMBER_PERMISSION_CATALOG.filter((item) => item.group === group);
}

export function getMemberRoleTemplatePermissionCount(roleCode: MemberPermissionRoleTemplateCode): number {
  return MEMBER_ROLE_TEMPLATE_POLICIES.find((role) => role.code === roleCode)?.permissionCodes.length ?? 0;
}

export function hasMemberRoleTemplatePermission(roleCode: MemberPermissionRoleTemplateCode, permissionCode: MemberPermissionCode): boolean {
  return MEMBER_PERMISSION_MATRIX_ROWS.some((row) => row.roleCode === roleCode && row.permissionCode === permissionCode && row.enabled);
}
