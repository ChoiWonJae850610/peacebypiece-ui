export const WORKORDER_CRUD_PERMISSIONS = [
  "workorder.create",
  "workorder.read",
  "workorder.update",
  "workorder.delete",
  "workorder.reorder",
] as const;

export const MEMO_CRUD_PERMISSIONS = [
  "memo.create",
  "memo.read",
  "memo.update",
  "memo.delete",
] as const;

export const ATTACHMENT_CRUD_PERMISSIONS = [
  "attachment.create",
  "attachment.read",
  "attachment.update",
  "attachment.delete",
  "attachment.restore",
  "attachment.purge",
] as const;

export const WORKFLOW_ACTION_PERMISSIONS = [
  "workflow.requestReview",
  "workflow.completeReview",
  "workflow.reject",
  "workflow.requestOrder",
  "workflow.inspect",
  "workflow.complete",
] as const;

export const MASTER_DATA_PERMISSIONS = [
  "partner.create",
  "partner.read",
  "partner.update",
  "partner.delete",
  "productType.create",
  "productType.read",
  "productType.update",
  "productType.delete",
  "unit.create",
  "unit.read",
  "unit.update",
  "unit.delete",
  "processType.create",
  "processType.read",
  "processType.update",
  "processType.delete",
] as const;

export const STATS_PERMISSIONS = [
  "stats.basic",
  "stats.category",
  "stats.factory",
  "stats.reorder",
  "stats.quality",
  "stats.storageAdvanced",
  "stats.export",
  "stats.system",
] as const;

export const OPERATION_PERMISSIONS = [
  "inventory.manage",
  "member.invite",
  "billing.manage",
  "storage.manage",
  "system.storage.manage",
] as const;

export const LEGACY_PERMISSION_ALIASES = [
  "workorder.edit",
  "workorder.request_review",
  "workorder.skip_review",
  "workorder.request_order",
  "workorder.inspect",
  "workorder.complete",
  "partner.manage",
] as const;

export const PERMISSIONS = [
  ...WORKORDER_CRUD_PERMISSIONS,
  ...MEMO_CRUD_PERMISSIONS,
  ...ATTACHMENT_CRUD_PERMISSIONS,
  ...WORKFLOW_ACTION_PERMISSIONS,
  ...MASTER_DATA_PERMISSIONS,
  ...STATS_PERMISSIONS,
  ...OPERATION_PERMISSIONS,
  ...LEGACY_PERMISSION_ALIASES,
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type PermissionRole = "admin" | "designer" | "inspector" | "inventory";

export type PermissionProfile = {
  role: PermissionRole;
  permissions: readonly Permission[];
};

export type PermissionGroup = {
  key: string;
  title: string;
  description: string;
  permissions: readonly Permission[];
};

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    key: "workorder",
    title: "작업지시서",
    description: "작업지시서 생성, 조회, 수정, 삭제, 리오더 권한을 분리합니다.",
    permissions: WORKORDER_CRUD_PERMISSIONS,
  },
  {
    key: "workflow",
    title: "워크플로우 액션",
    description: "검토요청, 검토완료, 반려, 발주요청, 검수, 완료 액션 권한을 분리합니다.",
    permissions: WORKFLOW_ACTION_PERMISSIONS,
  },
  {
    key: "memo",
    title: "메모",
    description: "작업메모의 작성, 조회, 수정, 삭제 권한을 분리합니다.",
    permissions: MEMO_CRUD_PERMISSIONS,
  },
  {
    key: "attachment",
    title: "첨부/디자인",
    description: "첨부파일, 디자인, 메모 첨부의 생성, 조회, 수정, 삭제, 복원, 영구삭제 권한을 분리합니다.",
    permissions: ATTACHMENT_CRUD_PERMISSIONS,
  },
  {
    key: "master-data",
    title: "기준정보",
    description: "협력업체, 생산품유형, 단위표준, 외주공정유형 관리 권한을 분리합니다.",
    permissions: MASTER_DATA_PERMISSIONS,
  },
  {
    key: "stats",
    title: "통계/요금제 기능",
    description: "Basic, Standard, Growth, Premium, System 통계 노출 권한을 feature key와 연결합니다.",
    permissions: STATS_PERMISSIONS,
  },
  {
    key: "operation",
    title: "운영",
    description: "재고, 초대, 요금제, 저장소, 시스템 저장소 관리 권한입니다.",
    permissions: OPERATION_PERMISSIONS,
  },
] as const;

const ADMIN_PERMISSIONS = PERMISSIONS;

const DESIGNER_PERMISSIONS = [
  "workorder.create",
  "workorder.read",
  "workorder.update",
  "memo.create",
  "memo.read",
  "memo.update",
  "attachment.create",
  "attachment.read",
  "attachment.update",
  "workflow.requestReview",
  "stats.basic",
  "workorder.edit",
  "workorder.request_review",
] as const satisfies readonly Permission[];

const INSPECTOR_PERMISSIONS = [
  "workorder.read",
  "memo.read",
  "attachment.read",
  "workflow.inspect",
  "workflow.complete",
  "stats.basic",
  "workorder.inspect",
  "workorder.complete",
] as const satisfies readonly Permission[];

const INVENTORY_PERMISSIONS = [
  "workorder.read",
  "partner.read",
  "unit.read",
  "processType.read",
  "inventory.manage",
  "stats.basic",
] as const satisfies readonly Permission[];

export const DEFAULT_PERMISSION_PROFILES = {
  admin: {
    role: "admin",
    permissions: ADMIN_PERMISSIONS,
  },
  designer: {
    role: "designer",
    permissions: DESIGNER_PERMISSIONS,
  },
  inspector: {
    role: "inspector",
    permissions: INSPECTOR_PERMISSIONS,
  },
  inventory: {
    role: "inventory",
    permissions: INVENTORY_PERMISSIONS,
  },
} as const satisfies Record<PermissionRole, PermissionProfile>;

export type PermissionInput = {
  role?: PermissionRole | string | null;
  permissions?: readonly (Permission | string)[] | null;
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function normalizePermissions(input: PermissionInput): readonly Permission[] {
  const basePermissions =
    input.role && input.role in DEFAULT_PERMISSION_PROFILES
      ? DEFAULT_PERMISSION_PROFILES[input.role as PermissionRole].permissions
      : [];

  const explicitPermissions = (input.permissions ?? []).filter((value): value is Permission =>
    typeof value === "string" && isPermission(value),
  );

  return Array.from(new Set<Permission>([...basePermissions, ...explicitPermissions]));
}

export function hasPermission(input: PermissionInput, permission: Permission): boolean {
  return normalizePermissions(input).includes(permission);
}

export function hasEveryPermission(input: PermissionInput, permissions: readonly Permission[]): boolean {
  const normalizedPermissions = normalizePermissions(input);
  return permissions.every((permission) => normalizedPermissions.includes(permission));
}

export function hasSomePermission(input: PermissionInput, permissions: readonly Permission[]): boolean {
  const normalizedPermissions = normalizePermissions(input);
  return permissions.some((permission) => normalizedPermissions.includes(permission));
}
