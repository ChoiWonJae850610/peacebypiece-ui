import type { RoleTemplate, RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";

export const ROLE_TEMPLATES: Record<RoleType, RoleTemplate> = {
  "디자이너": {
    role: "디자이너",
    label: "디자이너",
    description: "작업지시 작성, 검토 요청, 발주 요청 중심 역할",
    team: "디자이너",
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: false,
      canEditInventory: false,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: false,
    },
  },
  "관리자": {
    role: "관리자",
    label: "관리자",
    description: "전체 승인과 비용, 권한 관리가 가능한 역할",
    team: "관리자",
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: true,
      canEditInventory: true,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: true,
    },
  },
  "입고/검수": {
    role: "입고/검수",
    label: "입고/검수",
    description: "입고 등록, 검수 완료, 재고 수정 중심 역할",
    team: "입고/검수",
    permissions: {
      canSeeProductionSections: false,
      canSeeCostSections: false,
      canEditInventory: true,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: false,
    },
  },
};

export const ROLE_OPTIONS = Object.values(ROLE_TEMPLATES).map((item) => ({
  role: item.role,
  title: item.label,
  description: item.description,
}));

export function getPermissionSummary(user: Pick<UserProfile, "role" | "team">): string {
  return user.role ?? user.team;
}
