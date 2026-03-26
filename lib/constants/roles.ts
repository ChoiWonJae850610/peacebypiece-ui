import type { RoleType, UserPermissions, UserProfile } from "@/types/workorder";

const designerPermissions: UserPermissions = {
  viewAttachments: true,
  editAttachments: true,
  viewCost: false,
  viewInventoryHistory: false,
  viewProductionDetails: true,
  inventoryEdit: false,
  permissionManage: false,
  requestReview: true,
  approveReview: false,
  requestPurchase: true,
  confirmPurchase: false,
  registerInbound: false,
  completeInspection: false,
  completeWork: false,
};

const adminPermissions: UserPermissions = {
  viewAttachments: true,
  editAttachments: true,
  viewCost: true,
  viewInventoryHistory: true,
  viewProductionDetails: true,
  inventoryEdit: true,
  permissionManage: true,
  requestReview: true,
  approveReview: true,
  requestPurchase: true,
  confirmPurchase: true,
  registerInbound: true,
  completeInspection: true,
  completeWork: true,
};

const inspectionPermissions: UserPermissions = {
  viewAttachments: true,
  editAttachments: false,
  viewCost: false,
  viewInventoryHistory: true,
  viewProductionDetails: true,
  inventoryEdit: true,
  permissionManage: false,
  requestReview: false,
  approveReview: false,
  requestPurchase: false,
  confirmPurchase: false,
  registerInbound: true,
  completeInspection: true,
  completeWork: true,
};

export const ROLE_PRESETS: Record<RoleType, { team: RoleType; permissions: UserPermissions }> = {
  디자이너: { team: "디자이너", permissions: designerPermissions },
  관리자: { team: "관리자", permissions: adminPermissions },
  "입고/검수": { team: "입고/검수", permissions: inspectionPermissions },
};

export const ROLE_OPTIONS = [
  { role: "디자이너", title: "디자이너", description: "작업지시 작성, 검토 요청, 발주 요청 중심 역할" },
  { role: "관리자", title: "관리자", description: "전체 승인과 비용, 권한 관리가 가능한 역할" },
  { role: "입고/검수", title: "입고/검수", description: "입고 등록, 검수 완료, 재고 수정 중심 역할" },
] as const;

export const INITIAL_USERS: UserProfile[] = [
  { id: "user-designer", name: "김디자이너", team: "디자이너", permissions: { ...designerPermissions } },
  { id: "user-admin", name: "박관리", team: "관리자", permissions: { ...adminPermissions } },
  { id: "user-inspection", name: "이검수", team: "입고/검수", permissions: { ...inspectionPermissions } },
];

export function getPermissionSummary(user: Pick<UserProfile, "team">) {
  return user.team;
}
