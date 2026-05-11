import { ADMIN_WORKSPACE_PERMISSIONS, type Permission } from "@/lib/permissions";

export type AdminWorkspacePermission = Extract<Permission, (typeof ADMIN_WORKSPACE_PERMISSIONS)[keyof typeof ADMIN_WORKSPACE_PERMISSIONS]>;

export type AdminWorkspaceCardStatus = "available" | "planned";

export type AdminWorkspaceCard = {
  id: string;
  label: string;
  description: string;
  permission: AdminWorkspacePermission;
  href: string | null;
  status: AdminWorkspaceCardStatus;
  statusLabel: string;
};

export const ADMIN_WORKSPACE_WORK_ENTRY_CARD: AdminWorkspaceCard = {
  id: "workorder-entry",
  label: "작업지시서 업무 화면",
  description: "작업지시서 목록과 상세 업무 화면으로 이동합니다.",
  permission: ADMIN_WORKSPACE_PERMISSIONS.workorderAccess,
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
    href: "/admin/partners",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "files",
    label: "저장소 관리",
    description: "문서/디자인, 휴지통, 용량 사용량을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.storageManage,
    href: "/admin/files",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "stats",
    label: "통계정보",
    description: "작업지시서, 협력업체, 파일 사용량 지표를 확인합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.statsView,
    href: "/admin/dashboard",
    status: "available",
    statusLabel: "조회",
  },
  {
    id: "settings",
    label: "환경설정",
    description: "고객사별 화면, 파일, 알림 정책을 관리합니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.organizationSettingsManage,
    href: "/admin/settings",
    status: "available",
    statusLabel: "관리",
  },
  {
    id: "member-management",
    label: "멤버 관리",
    description: "초대 수락 이후 멤버 권한 관리 화면으로 확장할 영역입니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.memberManage,
    href: null,
    status: "planned",
    statusLabel: "후순위",
  },
];

export const ADMIN_WORKSPACE_FUTURE_PERMISSION_CARDS: AdminWorkspaceCard[] = [
  {
    id: "standard-units",
    label: "단위표준",
    description: "원단, 부자재, 생산 수량 단위 기준을 멤버에게 위임할 수 있는 관리 영역입니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.standardUnitManage,
    href: null,
    status: "planned",
    statusLabel: "권한 후보",
  },
  {
    id: "outsourcing-processes",
    label: "외주공정",
    description: "나염, 자수, 워싱 등 외주공정 기준을 멤버에게 위임할 수 있는 관리 영역입니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.outsourcingProcessManage,
    href: null,
    status: "planned",
    statusLabel: "권한 후보",
  },
  {
    id: "product-types",
    label: "생산품유형",
    description: "작업지시서 품목 분류 기준을 멤버에게 위임할 수 있는 관리 영역입니다.",
    permission: ADMIN_WORKSPACE_PERMISSIONS.productTypeManage,
    href: null,
    status: "planned",
    statusLabel: "권한 후보",
  },
];

export function getAdminWorkspaceWorkEntryCard(): AdminWorkspaceCard {
  return ADMIN_WORKSPACE_WORK_ENTRY_CARD;
}

export function getAdminWorkspaceManagementCards(): AdminWorkspaceCard[] {
  return ADMIN_WORKSPACE_MANAGEMENT_CARDS;
}

export function getAdminWorkspaceFuturePermissionCards(): AdminWorkspaceCard[] {
  return ADMIN_WORKSPACE_FUTURE_PERMISSION_CARDS;
}
