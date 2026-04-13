import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getFixtureI18n } from "@/lib/data/mock/fixtureI18n";
import type { MockUserSource } from "@/lib/data/mock/types";
import type { UserProfile } from "@/types/user";
import { ROLE, buildUserRoleState } from "@/lib/constants/roles";

export function buildUserSeedSource(locale: Locale = DEFAULT_LOCALE): MockUserSource {
  const fixture = getFixtureI18n(locale);
  const users: UserProfile[] = [
    {
      id: "user-designer",
      name: fixture.users.designer,
      ...buildUserRoleState([ROLE.designer]),
    },
    {
      id: "user-admin",
      name: fixture.users.admin,
      ...buildUserRoleState([ROLE.admin]),
    },
    {
      id: "user-qc",
      name: fixture.users.inspector,
      ...buildUserRoleState([ROLE.inspector]),
    },
  ];

  return {
    users,
    defaultCurrentUserId: users[0]?.id ?? "",
    defaultPermissionTargetId: users[0]?.id ?? "",
  };
}

export const WORKORDER_USER_SEED_SOURCE: MockUserSource = buildUserSeedSource();
export const WORKORDER_SEED_USERS = WORKORDER_USER_SEED_SOURCE.users;
export const MOCK_USERS = WORKORDER_SEED_USERS;
export const DEFAULT_CURRENT_USER_ID = WORKORDER_USER_SEED_SOURCE.defaultCurrentUserId;
export const DEFAULT_PERMISSION_TARGET_ID = WORKORDER_USER_SEED_SOURCE.defaultPermissionTargetId;
