export const ROLE_VALUES = ["designer", "admin", "inspector"] as const;

export type RoleType = (typeof ROLE_VALUES)[number];

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
