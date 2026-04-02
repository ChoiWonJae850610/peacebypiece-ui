import { ROLE_TEMPLATES } from "@/lib/constants/roles";
import type { MockUserSource } from "@/lib/data/mock/types";
import type { UserProfile } from "@/types/user";

const users: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    team: "디자이너",
    role: "디자이너",
    permissions: ROLE_TEMPLATES["디자이너"].permissions,
  },
  {
    id: "user-admin",
    name: "박관리",
    team: "관리자",
    role: "관리자",
    permissions: ROLE_TEMPLATES["관리자"].permissions,
  },
  {
    id: "user-qc",
    name: "이검수",
    team: "입고/검수",
    role: "입고/검수",
    permissions: ROLE_TEMPLATES["입고/검수"].permissions,
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
