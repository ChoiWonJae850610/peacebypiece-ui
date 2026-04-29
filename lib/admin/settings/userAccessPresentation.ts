import { ROLE_DISPLAY_GUIDE, formatRoles } from "@/lib/constants/roles";
import { WORKORDER_SEED_USERS } from "@/lib/data/mock/users";
import type { UserProfile } from "@/types/user";

export type AdminUserAccessSourceState = "db-prepared" | "mock-adapter";

export type AdminUserAccessChecklistItem = {
  id: string;
  done: boolean;
};

export type AdminUserAccessViewModel = {
  sourceState: AdminUserAccessSourceState;
  userCount: number;
  users: Array<{
    id: string;
    name: string;
    roleSummary: string;
    canAssignRoles: boolean;
    canEditInventory: boolean;
    canSeeCostSections: boolean;
  }>;
  roleGuide: typeof ROLE_DISPLAY_GUIDE;
  checklist: AdminUserAccessChecklistItem[];
};

export function buildAdminUserAccessViewModel(users: readonly UserProfile[] = WORKORDER_SEED_USERS): AdminUserAccessViewModel {
  return {
    sourceState: "mock-adapter",
    userCount: users.length,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      roleSummary: formatRoles(user.roles, user.role),
      canAssignRoles: user.permissions.canAssignRoles,
      canEditInventory: user.permissions.canEditInventory,
      canSeeCostSections: user.permissions.canSeeCostSections,
    })),
    roleGuide: ROLE_DISPLAY_GUIDE,
    checklist: [
      { id: "users-table", done: true },
      { id: "company-users-table", done: true },
      { id: "role-policy", done: true },
      { id: "login-adapter", done: false },
    ],
  };
}
