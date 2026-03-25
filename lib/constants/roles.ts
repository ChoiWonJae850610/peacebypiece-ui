import type { PermissionSet, RoleType, UserProfile } from "@/types/workorder";

export const DEFAULT_PERMISSIONS: PermissionSet = {
  createWorkorder: false,
  reviewRequest: false,
  reviewApprove: false,
  orderRequest: false,
  orderConfirm: false,
  inbound: false,
  inspection: false,
  inventoryEdit: false,
  permissionManage: false,
  viewProductionDetails: false,
  viewCost: false,
  viewInventoryHistory: false,
  viewAttachments: false,
  editAttachments: false,
};

export const ROLE_PRESETS: Record<
  RoleType,
  { team: RoleType; permissions: PermissionSet }
> = {
  디자이너: {
    team: "디자이너",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      createWorkorder: true,
      reviewRequest: true,
      orderRequest: true,
      viewProductionDetails: true,
      viewCost: true,
      viewAttachments: true,
      editAttachments: true,
    },
  },
  관리자: {
    team: "관리자",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      createWorkorder: true,
      reviewRequest: true,
      reviewApprove: true,
      orderRequest: true,
      orderConfirm: true,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
      permissionManage: true,
      viewProductionDetails: true,
      viewCost: true,
      viewInventoryHistory: true,
      viewAttachments: true,
      editAttachments: true,
    },
  },
  "입고/검수": {
    team: "입고/검수",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      inbound: true,
      inspection: true,
      inventoryEdit: true,
      viewInventoryHistory: true,
      viewAttachments: true,
    },
  },
};

export type RolePermissionTemplateMap = typeof ROLE_PRESETS;

export const ROLE_OPTIONS: { role: RoleType; title: string; description: string }[] = [
  {
    role: "디자이너",
    title: "디자이너",
    description: "작업지시 작성, 검토 요청, 발주 요청 중심",
  },
  {
    role: "관리자",
    title: "관리자",
    description: "전체 승인, 발주 확정, 상태 관리까지 가능",
  },
  {
    role: "입고/검수",
    title: "입고/검수",
    description: "입고 처리, 검수 완료, 재고 수정 중심",
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    team: "디자이너",
    permissions: {
      ...ROLE_PRESETS["디자이너"].permissions,
    },
  },
  {
    id: "user-admin",
    name: "박관리",
    team: "관리자",
    permissions: {
      ...ROLE_PRESETS["관리자"].permissions,
    },
  },
  {
    id: "user-inspection",
    name: "이검수",
    team: "입고/검수",
    permissions: {
      ...ROLE_PRESETS["입고/검수"].permissions,
    },
  },
];

export function getPermissionSummary(user: UserProfile): RoleType {
  if (user.team === "관리자") return "관리자";
  if (user.team === "입고/검수") return "입고/검수";
  if (user.team === "디자이너") return "디자이너";
  if (user.permissions.permissionManage) return "관리자";
  if (user.permissions.inventoryEdit && user.permissions.inspection) return "입고/검수";
  return "디자이너";
}
