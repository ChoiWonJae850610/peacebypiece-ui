import {
  ADMIN_WORKSPACE_PERMISSIONS,
  getMemberRoleTemplatePermissions,
  hasEveryMemberPermission,
  type MemberPermissionCode,
  type Permission,
} from "@/lib/permissions";

export type AdminWorkspacePermission = Extract<Permission, (typeof ADMIN_WORKSPACE_PERMISSIONS)[keyof typeof ADMIN_WORKSPACE_PERMISSIONS]>;

export type AdminWorkspaceCardStatus = "available" | "planned";

export type AdminWorkspaceCard = {
  id: string;
  label: string;
  description: string;
  permission: AdminWorkspacePermission;
  requiredMemberPermissions: readonly MemberPermissionCode[];
  href: string | null;
  status: AdminWorkspaceCardStatus;
  statusLabel: string;
};

export const ADMIN_WORKSPACE_WORK_ENTRY_CARD: AdminWorkspaceCard = {
  id: "workorder-entry",
  label: "작업지시서 업무 화면",
  description: "작업지시서 목록과 상세 업무 화면으로 이동합니다.",
  permission: ADMIN_WORKSPACE_PERMISSIONS.workorderAccess,
  requiredMemberPermissions: ["workorder.read"],
  href: "/worker",
  status: "available",
  statusLabel: "업무 화면",
};

export const ADMIN_WORKSPACE_MANAGEMENT_CARDS: AdminWorkspaceCard[] = [
  {
    id: "partners",
    label: "협력업체 관리",
    description: "공장, 원단, 부자재, 외주처 기준정보를 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.partnerManage,
    requiredMemberPermissions: ["partner.read"],
    href: "/admin/partners",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "files",
    label: "저장소 관리",
    description: "문서/디자인, 휴지통, 용량 사용량을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.storageManage,
    requiredMemberPermissions: ["storage.read"],
    href: "/admin/files",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "stats",
    label: "통계정보",
    description: "작업지시서, 협력업체, 파일 사용량 지표를 확인합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.statsView,
    requiredMemberPermissions: [],
    href: "/admin/stats",
    status: "available",
    statusLabel: "조회",
  },
  {
    id: "settings",
    label: "환경설정",
    description: "고객사별 화면, 파일, 알림 정책을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.organizationSettingsManage,
    requiredMemberPermissions: ["settings.read"],
    href: "/admin/settings",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "member-management",
    label: "멤버 관리",
    description: "멤버 초대, 가입 승인, 역할 권한을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.memberManage,
    requiredMemberPermissions: ["member.read"],
    href: "/admin/members",
    status: "available",
    statusLabel: "관리",
  },
];

export const ADMIN_WORKSPACE_FUTURE_PERMISSION_CARDS: AdminWorkspaceCard[] = [
  {
    id: "standard-units",
    label: "단위표준",
    description: "원단, 부자재, 생산 수량에 사용하는 단위 기준을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.standardUnitManage,
    requiredMemberPermissions: ["standards.manage"],
    href: null,
    status: "planned",
    statusLabel: "준비 중",
  },
  {
    id: "outsourcing-processes",
    label: "외주공정",
    description: "나염, 자수, 워싱 등 외주공정 기준을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.outsourcingProcessManage,
    requiredMemberPermissions: ["standards.manage"],
    href: null,
    status: "planned",
    statusLabel: "준비 중",
  },
  {
    id: "product-types",
    label: "생산품유형",
    description: "작업지시서 품목과 생산품 분류 기준을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.productTypeManage,
    requiredMemberPermissions: ["standards.manage"],
    href: null,
    status: "planned",
    statusLabel: "준비 중",
  },
];


export const ADMIN_HOME_PRIMARY_CARD_IDS = [
  "workorder-entry",
  "partners",
  "files",
  "stats",
  "member-management",
] as const;

export const ADMIN_HOME_MEMBER_CARD_IDS = [] as const;

function filterAdminWorkspaceCardsByIds(
  cards: readonly AdminWorkspaceCard[],
  ids: readonly string[],
): AdminWorkspaceCard[] {
  const allowedIds = new Set(ids);
  return cards.filter((card) => allowedIds.has(card.id));
}

export type AdminWorkspaceAccessInput = {
  permissionCodes?: readonly MemberPermissionCode[] | null;
};

export const ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES = getMemberRoleTemplatePermissions("company_admin");

export function canAccessAdminWorkspaceCard(card: AdminWorkspaceCard, input: AdminWorkspaceAccessInput): boolean {
  return hasEveryMemberPermission({ permissionCodes: input.permissionCodes }, card.requiredMemberPermissions);
}

export function filterAdminWorkspaceCardsByPermissions(
  cards: readonly AdminWorkspaceCard[],
  input: AdminWorkspaceAccessInput,
): AdminWorkspaceCard[] {
  return cards.filter((card) => canAccessAdminWorkspaceCard(card, input));
}

export function getAdminWorkspaceWorkEntryCard(): AdminWorkspaceCard {
  return ADMIN_WORKSPACE_WORK_ENTRY_CARD;
}

export function getAdminWorkspaceManagementCards(): AdminWorkspaceCard[] {
  return ADMIN_WORKSPACE_MANAGEMENT_CARDS;
}

export function getAdminWorkspaceFuturePermissionCards(): AdminWorkspaceCard[] {
  return ADMIN_WORKSPACE_FUTURE_PERMISSION_CARDS;
}

export function getVisibleAdminWorkspaceCards(input: AdminWorkspaceAccessInput): AdminWorkspaceCard[] {
  return filterAdminWorkspaceCardsByPermissions([ADMIN_WORKSPACE_WORK_ENTRY_CARD, ...ADMIN_WORKSPACE_MANAGEMENT_CARDS], input);
}

export function getVisibleAdminWorkspaceManagementCards(input: AdminWorkspaceAccessInput): AdminWorkspaceCard[] {
  return filterAdminWorkspaceCardsByPermissions(ADMIN_WORKSPACE_MANAGEMENT_CARDS, input);
}


export function getVisibleAdminHomePrimaryCards(input: AdminWorkspaceAccessInput): AdminWorkspaceCard[] {
  return filterAdminWorkspaceCardsByIds(getVisibleAdminWorkspaceCards(input), ADMIN_HOME_PRIMARY_CARD_IDS);
}

export function getVisibleAdminHomeMemberCards(input: AdminWorkspaceAccessInput): AdminWorkspaceCard[] {
  return filterAdminWorkspaceCardsByIds(getVisibleAdminWorkspaceManagementCards(input), ADMIN_HOME_MEMBER_CARD_IDS);
}
