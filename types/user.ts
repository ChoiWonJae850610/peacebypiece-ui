import type { PermissionSet, RoleType } from "@/types/permission";

export type UserProfile = {
  id: string;
  name: string;
  team: RoleType;
  role: RoleType;
  permissions: PermissionSet;
};
