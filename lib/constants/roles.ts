import type { PermissionMap, RoleType, UserProfile } from "@/types/workorder";

const designerPermissions: PermissionMap = {
  viewProductionDetails: true,
  viewCost: true,
  viewAttachments: true,
  editAttachments: true,
  permissionManage: false,
  inventoryEdit: false,
  viewInventoryHistory: false,
};

const adminPermissions: PermissionMap = {
  viewProductionDetails: true,
  viewCost: true,
  viewAttachments: true,
  editAttachments: true,
  permissionManage: true,
  inventoryEdit: true,
  viewInventoryHistory: true,
};

const inventoryPermissions: PermissionMap = {
  viewProductionDetails: true,
  viewCost: false,
  viewAttachments: true,
  editAttachments: false,
  permissionManage: false,
  inventoryEdit: true,
  viewInventoryHistory: true,
};

export const ROLE_PRESETS: Record<RoleType, { team: RoleType; permissions: PermissionMap }> = {
  디자이너: { team: "디자이너", permissions: designerPermissions },
  관리자: { team: "관리자", permissions: adminPermissions },
  "입고/검수": { team: "입고/검수", permissions: inventoryPermissions },
};

export const ROLE_OPTIONS = [
  { role: "디자이너" as const, title: "디자이너", description: "작업지시 작성과 검토/발주 요청 중심 역할" },
  { role: "관리자" as const, title: "관리자", description: "전체 승인과 첨부 삭제, 권한 관리까지 가능" },
  { role: "입고/검수" as const, title: "입고/검수", description: "입고 처리와 재고 수정, 재고 히스토리 확인 중심" },
];

export const INITIAL_USERS: UserProfile[] = [
  { id: "user-admin", name: "박관리", team: "관리자", permissions: { ...adminPermissions } },
  { id: "user-designer", name: "김디자이너", team: "디자이너", permissions: { ...designerPermissions } },
  { id: "user-inspector", name: "이검수", team: "입고/검수", permissions: { ...inventoryPermissions } },
  { id: "user-merch", name: "이담당", team: "디자이너", permissions: { ...designerPermissions } },
];

export function getPermissionSummary(user?: Pick<UserProfile, "team"> | null): RoleType {
  if (!user) return "디자이너";
  return user.team;
}
