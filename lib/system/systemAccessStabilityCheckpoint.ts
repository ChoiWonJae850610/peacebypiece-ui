export type SystemAccessCheckpointStatus =
  | "stable"
  | "ready"
  | "partial"
  | "deferred";

export type SystemAccessCheckpointItem = {
  id: string;
  label: string;
  description: string;
  status: SystemAccessCheckpointStatus;
  statusLabel: string;
  route?: string;
  owner: "admin" | "system" | "common" | "api" | "db";
};

export type SystemAccessCheckpointGroup = {
  id: string;
  title: string;
  description: string;
  items: SystemAccessCheckpointItem[];
};

export const SYSTEM_ACCESS_CHECKPOINT_SUMMARY = {
  title: "멤버·초대·권한 1차 안정화 체크포인트",
  description:
    "0.10.52부터 0.10.69까지 정리한 계정, 초대, 승인, 권한, 이메일 발송 검토 흐름을 한 화면에서 점검합니다.",
  versionRange: "0.10.52 ~ 0.10.69",
  nextVersion: "0.10.71",
} as const;

export const SYSTEM_ACCESS_CHECKPOINT_GROUPS: SystemAccessCheckpointGroup[] = [
  {
    id: "member-invitation",
    title: "고객관리자 내부 멤버 초대",
    description:
      "고객관리자가 내부 구성원에게 초대 링크와 QR을 전달하고 가입 신청까지 이어지는 흐름입니다.",
    items: [
      {
        id: "admin-members-ia",
        label: "멤버관리 IA",
        description: "멤버 목록, 초대 대기, 가입 신청 대기, 권한 요약 영역을 분리했습니다.",
        status: "stable",
        statusLabel: "화면 안정",
        route: "/admin/members",
        owner: "admin",
      },
      {
        id: "member-invite-link-qr",
        label: "멤버 초대 링크·QR",
        description: "초대 대상, 기본 권한 묶음, 만료일, 링크·QR preview를 배치했습니다.",
        status: "ready",
        statusLabel: "API 연결 전",
        route: "/admin/members",
        owner: "admin",
      },
      {
        id: "member-join-request",
        label: "멤버 가입 신청 화면",
        description: "초대 링크 접속 후 Google 로그인과 가입 신청으로 이어지는 preview 화면을 추가했습니다.",
        status: "ready",
        statusLabel: "저장 전",
        route: "/invite/member/preview-company-member-token",
        owner: "common",
      },
    ],
  },
  {
    id: "company-invitation",
    title: "시스템관리자 고객사 초대",
    description:
      "시스템관리자가 고객사 담당자에게 초대 링크와 QR을 제공하고 회사 생성 승인으로 이어지는 흐름입니다.",
    items: [
      {
        id: "system-customer-invite",
        label: "고객사 초대 링크·QR",
        description: "고객사 초대 입력, 초대 링크 preview, QR preview, 승인 기준을 정리했습니다.",
        status: "ready",
        statusLabel: "API 연결 전",
        route: "/system/invites",
        owner: "system",
      },
      {
        id: "company-join-request",
        label: "고객사 가입 신청 화면",
        description: "고객사 초대 링크 접속 후 회사명, 담당자, 연락처 신청 영역을 추가했습니다.",
        status: "ready",
        statusLabel: "저장 전",
        route: "/invite/company/preview-system-company-token",
        owner: "common",
      },
      {
        id: "system-company-approval",
        label: "고객사 승인·회사 생성",
        description: "가입 신청 검토, 고객사 생성, 고객관리자 승인, 권한 부여 절차를 화면에 고정했습니다.",
        status: "partial",
        statusLabel: "실제 생성 전",
        route: "/system/companies",
        owner: "system",
      },
    ],
  },
  {
    id: "permission-access",
    title: "권한과 접근 제한",
    description:
      "role enum 단독 제어가 아니라 permission_code 직접 부여 방식을 기준으로 카드와 API 검증 구조를 정리했습니다.",
    items: [
      {
        id: "permission-catalog",
        label: "권한 카탈로그·매트릭스",
        description: "권한 그룹과 role template 기본 체크값을 분리했습니다.",
        status: "stable",
        statusLabel: "정책 정리",
        route: "/admin/members",
        owner: "admin",
      },
      {
        id: "admin-card-access",
        label: "관리자 카드 노출 제한",
        description: "관리자 메인 카드 노출을 permission_code 기준으로 필터링하는 구조를 추가했습니다.",
        status: "partial",
        statusLabel: "preview 권한",
        route: "/admin",
        owner: "admin",
      },
      {
        id: "api-permission-guard",
        label: "API 권한 검증 1차",
        description: "주요 변경 API에 requireApiPermission 구조를 적용했습니다.",
        status: "partial",
        statusLabel: "세션 연결 전",
        route: "/api/workorders",
        owner: "api",
      },
    ],
  },
  {
    id: "pending-and-standards",
    title: "승인 대기와 초기 기준정보",
    description:
      "승인 전 사용자 제한 화면과 고객사 생성 후 기준정보 초기화 정책을 연결했습니다.",
    items: [
      {
        id: "pending-dashboard",
        label: "승인 대기 대시보드",
        description: "승인 전 사용자가 접근 가능한 제한 화면과 차단 범위를 정리했습니다.",
        status: "stable",
        statusLabel: "화면 안정",
        route: "/pending",
        owner: "common",
      },
      {
        id: "standards-initialization",
        label: "초기 기준정보 복사",
        description: "고객사 생성 후 단위 표준, 외주공정, 생산품 유형 기본 템플릿 복사를 repository로 분리했습니다.",
        status: "partial",
        statusLabel: "회사 생성 연결 대기",
        route: "/system/companies",
        owner: "db",
      },
      {
        id: "email-delivery-review",
        label: "자동 이메일 발송 검토",
        description: "1차는 링크 복사와 QR 공유를 유지하고, 자동 이메일 provider 비교는 문서화했습니다.",
        status: "deferred",
        statusLabel: "후순위",
        route: "/system/invites",
        owner: "system",
      },
    ],
  },
];

export const SYSTEM_ACCESS_CHECKPOINT_NEXT_ACTIONS = [
  "실제 Google OAuth/session 연결",
  "join_requests 조회와 승인/거절 API 연결",
  "companies 생성과 company_members/member_permissions 저장 연결",
  "preview permission context 제거 후 session 기반 권한 조회로 전환",
  "주요 API의 requireApiPermission 적용 범위 확대",
] as const;
