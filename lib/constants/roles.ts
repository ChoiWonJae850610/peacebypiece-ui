import type { RoleType, UserPermissions, UserProfile } from "@/types/workorder";

function createPermissions(overrides: Partial<UserPermissions>): UserPermissions {
  return {
    viewProductionDetails: false,
    viewCost: false,
    inventoryEdit: false,
    viewInventoryHistory: false,
    viewAttachments: true,
    requestReview: false,
    requestOrder: false,
    markInboundReady: false,
    startInspection: false,
    startProduction: false,
    completeWork: false,
    rejectWork: false,
    ...overrides,
  };
}

export const ROLE_PRESETS: Record<RoleType, { team: RoleType; permissions: UserPermissions }> = {
  관리자: {
    team: "관리자",
    permissions: createPermissions({
      viewProductionDetails: true,
      viewCost: true,
      inventoryEdit: true,
      viewInventoryHistory: true,
      viewAttachments: true,
      requestReview: true,
      requestOrder: true,
      markInboundReady: true,
      startInspection: true,
      startProduction: true,
      completeWork: true,
      rejectWork: true,
    }),
  },
  디자이너: {
    team: "디자이너",
    permissions: createPermissions({
      viewProductionDetails: true,
      viewCost: false,
      viewInventoryHistory: false,
      requestReview: true,
      requestOrder: true,
      rejectWork: true,
    }),
  },
  "입고/검수": {
    team: "입고/검수",
    permissions: createPermissions({
      viewProductionDetails: true,
      inventoryEdit: true,
      viewInventoryHistory: true,
      markInboundReady: true,
      startInspection: true,
      startProduction: true,
      completeWork: true,
    }),
  },
};

export const ROLE_OPTIONS: RoleType[] = ["관리자", "디자이너", "입고/검수"];

export const INITIAL_USERS: UserProfile[] = [
  { id: "user-admin", name: "박관리", ...ROLE_PRESETS["관리자"] },
  { id: "user-designer", name: "김디자이너", ...ROLE_PRESETS["디자이너"] },
  { id: "user-inspection", name: "이검수", ...ROLE_PRESETS["입고/검수"] },
];

export function getPermissionSummary(user: UserProfile): RoleType {
  return user.team;
}
