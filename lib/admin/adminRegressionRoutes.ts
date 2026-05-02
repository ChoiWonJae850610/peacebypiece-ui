export type AdminRegressionRouteStatus =
  | "stable"
  | "api"
  | "needs_component_restore"
  | "planned";

export interface AdminRegressionRouteItem {
  id: string;
  label: string;
  href: string;
  description: string;
  status: AdminRegressionRouteStatus;
  statusLabel: string;
  apiPath?: string;
  nextAction: string;
}

export const ADMIN_REGRESSION_ROUTES: AdminRegressionRouteItem[] = [
  {
    id: "dashboard",
    label: "관리자 홈",
    href: "/admin",
    description: "고객관리자 메뉴 허브입니다.",
    status: "stable",
    statusLabel: "안정화",
    nextAction: "기존 dashboard component 복원 여부는 별도 버전에서 판단합니다.",
  },
  {
    id: "partners",
    label: "거래처/공장관리",
    href: "/admin/partners",
    description: "거래처, 공장, 원단, 부자재, 외주 기준정보 관리 진입점입니다.",
    status: "stable",
    statusLabel: "read-only 복원",
    apiPath: "/api/admin/partners",
    nextAction: "0.9.100에서 read-only 거래처/공장관리 화면으로 복원했습니다. 생성/수정/외주공정 저장 action은 별도 버전에서 판단합니다.",
  },
  {
    id: "invites",
    label: "멤버 초대",
    href: "/admin/invites",
    description: "고객관리자가 디자이너, 검수담당자, 재고담당자를 초대하는 진입점입니다.",
    status: "stable",
    statusLabel: "안정화",
    apiPath: "/api/invitations?companyId=company-sample-customer",
    nextAction: "초대 UI는 API 연결 상태를 유지하고 DB 저장 흐름을 계속 점검합니다.",
  },
  {
    id: "files",
    label: "저장소 관리",
    href: "/admin/files",
    description: "첨부파일, 휴지통, 용량 사용량 관리 진입점입니다.",
    status: "stable",
    statusLabel: "read-only 복원",
    apiPath: "/api/admin/files/snapshot?period=7",
    nextAction: "0.9.98에서 read-only 파일 관리 화면으로 복원했습니다. 업로드/삭제 action 재연결은 별도 버전에서 판단합니다.",
  },
  {
    id: "history",
    label: "히스토리",
    href: "/admin/history",
    description: "작업지시서와 운영 변경 이력을 확인하는 진입점입니다.",
    status: "stable",
    statusLabel: "read-only 복원",
    nextAction: "0.9.99에서 read-only 히스토리 화면으로 복원했습니다. audit log 확장은 별도 버전에서 진행합니다.",
  },
  {
    id: "settings",
    label: "환경설정",
    href: "/admin/settings",
    description: "고객사별 화면, 파일, 알림, 사용자 접근 정책 설정 진입점입니다.",
    status: "stable",
    statusLabel: "read-only 복원",
    apiPath: "/api/admin/settings",
    nextAction: "0.9.101에서 read-only 환경설정 화면으로 복원했습니다. 설정 저장과 권한 변경 action은 별도 버전에서 판단합니다.",
  },
  {
    id: "admin-stats",
    label: "고객관리자 통계 API",
    href: "/api/admin/stats?companyId=company-sample-customer",
    description: "고객사 기준 작업지시서/첨부/용량 통계 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/admin/stats?companyId=company-sample-customer",
    nextAction: "화면 차트 연결은 후속 버전에서 진행합니다.",
  },
];

export const ADMIN_REGRESSION_POLICY_NOTES = [
  "이번 버전은 관리자 route가 깨진 JSX로 build/runtime을 막지 않도록 안정화하는 것이 목적입니다.",
  "정상 동작 중인 API와 DB 흐름은 변경하지 않습니다.",
  "하위 기능 컴포넌트가 JSX 손상 상태로 조회되는 화면은 안전한 진입점으로 대체합니다.",
  "기능 복원은 각 화면별로 원본 컴포넌트 무결성을 확인한 뒤 별도 버전에서 진행합니다.",
] as const;

export function getAdminRegressionRoute(
  id: string,
): AdminRegressionRouteItem | undefined {
  return ADMIN_REGRESSION_ROUTES.find((route) => route.id === id);
}
