import type { MockUserSource } from "@/lib/data/mock/types";
import type { UserProfile } from "@/types/user";
import { ROLE, buildUserRoleState } from "@/lib/constants/roles";

const users: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    ...buildUserRoleState([ROLE.designer]),
  },
  {
    id: "user-admin",
    name: "박관리",
    ...buildUserRoleState([ROLE.admin]),
  },
  {
    id: "user-qc",
    name: "이검수",
    ...buildUserRoleState([ROLE.inspector]),
  },
];

export const WORKORDER_USER_SEED_SOURCE: MockUserSource = {
  users,
  defaultCurrentUserId: users[0]?.id ?? "",
  defaultPermissionTargetId: users[0]?.id ?? "",
};

export const WORKORDER_SEED_USERS = WORKORDER_USER_SEED_SOURCE.users;
export const MOCK_USERS = WORKORDER_SEED_USERS;
export const DEFAULT_CURRENT_USER_ID = WORKORDER_USER_SEED_SOURCE.defaultCurrentUserId;
export const DEFAULT_PERMISSION_TARGET_ID = WORKORDER_USER_SEED_SOURCE.defaultPermissionTargetId;
