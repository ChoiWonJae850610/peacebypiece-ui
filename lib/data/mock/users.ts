import { ROLE_TEMPLATES } from "@/lib/constants/roles";
import type { UserProfile } from "@/types/user";

export const MOCK_USERS: UserProfile[] = [
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
