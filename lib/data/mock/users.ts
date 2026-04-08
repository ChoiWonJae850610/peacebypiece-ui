import type { MockUserSource } from "@/lib/data/mock/types";
import type { UserProfile } from "@/types/user";
import { buildUserRoleState } from "@/lib/constants/roles";

const users: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    ...buildUserRoleState(["디자이너"]),
  },
  {
    id: "user-admin",
    name: "박관리",
    ...buildUserRoleState(["관리자"]),
  },
  {
    id: "user-qc",
    name: "이검수",
    ...buildUserRoleState(["입고/검수"]),
  },
];

export const MOCK_USER_SOURCE: MockUserSource = {
  users,
  defaultCurrentUserId: users[0]?.id ?? "",
  defaultPermissionTargetId: users[0]?.id ?? "",
};

export const MOCK_USERS = MOCK_USER_SOURCE.users;
export const DEFAULT_CURRENT_USER_ID = MOCK_USER_SOURCE.defaultCurrentUserId;
export const DEFAULT_PERMISSION_TARGET_ID = MOCK_USER_SOURCE.defaultPermissionTargetId;
