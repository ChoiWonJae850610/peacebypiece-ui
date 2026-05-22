import type { PermissionSet, RoleType } from "@/types/permission";

export type UserProfile = {
  id: string;
  name: string;
  companyMemberId?: string | null;
  permissionCodes?: readonly string[];
  team: RoleType;
  role: RoleType;
  roles: RoleType[];
  permissions: PermissionSet;
};
