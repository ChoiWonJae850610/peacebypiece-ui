import type { PermissionSet, RoleType } from "@/types/permission";

export type UserProfile = {
  id: string;
  companyMemberId?: string | null;
  name: string;
  permissionCodes?: readonly string[];
  team: RoleType;
  role: RoleType;
  roles: RoleType[];
  permissions: PermissionSet;
};
