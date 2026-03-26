export type RoleType = "디자이너" | "관리자" | "입고/검수";

export type PermissionSet = {
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  canEditInventory: boolean;
  canSeeInventoryHistorySection: boolean;
  canSeeAttachments: boolean;
  canAssignRoles: boolean;
};

export type RoleTemplate = {
  role: RoleType;
  label: string;
  description: string;
  team: RoleType;
  permissions: PermissionSet;
};
