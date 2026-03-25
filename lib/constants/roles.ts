import type { PermissionSet, RoleType, UserProfile } from "@/types/workorder";

function permissionsFor(role: RoleType): PermissionSet {
  switch (role) {
    case "관리자":
      return {
        viewAttachments: true,
        editAttachments: true,
        viewCost: true,
        viewInventoryHistory: true,
        viewProductionDetails: true,
        inventoryEdit: true,
        permissionManage: true,
        requestReview: true,
        requestOrder: true,
        approveReview: true,
        confirmOrder: true,
        markProduction: true,
        startInspection: true,
        completeInspection: true,
      };
    case "입고/검수":
      return {
        viewAttachments: true,
        editAttachments: false,
        viewCost: false,
        viewInventoryHistory: true,
        viewProductionDetails: true,
        inventoryEdit: true,
        permissionManage: false,
        requestReview: false,
        requestOrder: false,
        approveReview: false,
        confirmOrder: false,
        markProduction: false,
        startInspection: true,
        completeInspection: true,
      };
    case "디자이너":
    default:
      return {
        viewAttachments: true,
        editAttachments: true,
        viewCost: true,
        viewInventoryHistory: false,
        viewProductionDetails: true,
        inventoryEdit: false,
        permissionManage: false,
        requestReview: true,
        requestOrder: true,
        approveReview: false,
        confirmOrder: false,
        markProduction: false,
        startInspection: false,
        completeInspection: false,
      };
  }
}

export const ROLE_PRESETS: Record<RoleType, { team: RoleType; permissions: PermissionSet }> = {
  "디자이너": { team: "디자이너", permissions: permissionsFor("디자이너") },
  "관리자": { team: "관리자", permissions: permissionsFor("관리자") },
  "입고/검수": { team: "입고/검수", permissions: permissionsFor("입고/검수") },
};

export const INITIAL_USERS: UserProfile[] = [
  { id: "user-designer", name: "김디자이너", team: "디자이너", permissions: { ...ROLE_PRESETS["디자이너"].permissions } },
  { id: "user-admin", name: "박관리", team: "관리자", permissions: { ...ROLE_PRESETS["관리자"].permissions } },
  { id: "user-inspection", name: "이검수", team: "입고/검수", permissions: { ...ROLE_PRESETS["입고/검수"].permissions } },
];

export const ROLE_OPTIONS: Array<{ role: RoleType; title: string; description: string }> = [
  { role: "디자이너", title: "디자이너", description: "작업지시 작성, 검토 요청, 첨부 관리" },
  { role: "관리자", title: "관리자", description: "승인, 발주 확정, 권한 설정 및 전체 관리" },
  { role: "입고/검수", title: "입고/검수", description: "입고 등록, 재고 수정, 검수 완료 처리" },
];

export function getPermissionSummary(user: Pick<UserProfile, "team">): RoleType {
  return user.team;
}
