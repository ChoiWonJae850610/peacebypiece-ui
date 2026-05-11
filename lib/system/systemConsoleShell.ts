export type SystemConsoleTabId =
  | "overview"
  | "companies"
  | "invites"
  | "plans"
  | "stats"
  | "logs"
  | "storage"
  | "standards"
  | "standardsSeedStatus"
  | "standardsRegression"
  | "standardsCustomerOnboarding"
  | "categoryRules";

export type SystemConsoleTabStatus =
  | "current"
  | "linked"
  | "api"
  | "planned"
  | "legacy";

export type SystemConsoleTab = {
  id: SystemConsoleTabId;
  label: string;
  description: string;
  statusLabel: string;
  status: SystemConsoleTabStatus;
  href?: string;
  apiPath?: string;
};

export type SystemConsolePlaceholder = {
  id: Exclude<SystemConsoleTabId, "overview" | "storage" | "standards" | "categoryRules">;
  title: string;
  description: string;
  items: string[];
  href?: string;
  apiPath?: string;
  actionLabel: string;
};

export const SYSTEM_CONSOLE_TABS: SystemConsoleTab[] = [
  {
    id: "overview",
    label: "전체 현황",
    description: "시스템관리자 콘솔의 현재 운영 상태를 확인합니다.",
    statusLabel: "현재 화면",
    status: "current",
    href: "/system",
  },
  {
    id: "companies",
    label: "고객사 관리",
    description: "고객사, 고객사 관리자, 사용 상태를 관리할 영역입니다.",
    statusLabel: "승인 화면",
    status: "linked",
    href: "/system/companies",
  },
  {
    id: "invites",
    label: "고객 초대",
    description: "시스템관리자가 고객사 관리자를 초대할 영역입니다.",
    statusLabel: "화면 연결",
    status: "linked",
    href: "/system/invites",
  },
  {
    id: "plans",
    label: "요금제·용량",
    description: "고객별 요금제와 저장 용량 override를 관리할 영역입니다.",
    statusLabel: "화면 연결",
    status: "linked",
    href: "/system/billing",
  },
  {
    id: "stats",
    label: "통계",
    description: "고객사, 저장용량, 초대, 요금제 통계를 확인할 영역입니다.",
    statusLabel: "화면 반영",
    status: "linked",
    href: "/system#system-stats",
  },
  {
    id: "logs",
    label: "감사 로그",
    description: "권한, 요금제, 저장소, 삭제 처리 같은 시스템 운영 이벤트를 감사 로그로 분리합니다.",
    statusLabel: "상태 로그 연결",
    status: "linked",
    href: "/system/audit-logs",
  },
  {
    id: "storage",
    label: "스토리지",
    description: "30일 경과 휴지통 파일의 R2 실제 삭제 후보를 확인합니다.",
    statusLabel: "화면 연결",
    status: "linked",
    href: "/system/storage-usage",
  },

  {
    id: "standards",
    label: "기준정보",
    description: "단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿의 시스템 표준 관리 방향을 설계합니다.",
    statusLabel: "설계 화면",
    status: "linked",
    href: "/system/standards",
  },
  {
    id: "standardsSeedStatus",
    label: "기준정보 seed",
    description: "DB 전용 기준정보 전환 후 seed 적용 상태와 활성 항목 수를 확인합니다.",
    statusLabel: "DB 점검",
    status: "linked",
    href: "/system/standards/seed-status",
  },
  {
    id: "standardsRegression",
    label: "기준정보 회귀점검",
    description: "DB-only 기준정보 전환 후 fallback 혼입, seed 부족, 고객사 연결 무결성을 점검합니다.",
    statusLabel: "회귀 점검",
    status: "linked",
    href: "/system/standards/regression",
  },
  {
    id: "standardsCustomerOnboarding",
    label: "고객사 초기 기준정보",
    description: "신규 고객사 생성 시 생산품 유형 기본 템플릿과 단위·외주공정 사용 연결을 복사하는 흐름을 설계합니다.",
    statusLabel: "설계 화면",
    status: "linked",
    href: "/system/standards/customer-onboarding",
  },
  {
    id: "categoryRules",
    label: "카테고리 규칙",
    description: "작업지시서 카테고리 추천 규칙 관리 기능을 유지합니다.",
    statusLabel: "기존 기능",
    status: "legacy",
    href: "/system/category-rules",
  },
];

export const SYSTEM_CONSOLE_PLACEHOLDERS: SystemConsolePlaceholder[] = [
  {
    id: "companies",
    title: "고객사 관리",
    description:
      "SaaS형 테넌트 구조를 위한 고객사 승인, 회사 생성, 고객관리자 권한 확정 화면입니다.",
    items: ["가입 신청 검토", "고객사 생성", "고객관리자 승인", "초기 기준정보 연결"],
    href: "/system/companies",
    actionLabel: "고객사 승인 화면 열기",
  },
  {
    id: "invites",
    title: "고객 초대",
    description:
      "이메일 발송 전 단계로 고객사 관리자 초대 링크와 QR 초대 흐름을 붙일 화면입니다.",
    items: ["고객사 관리자 초대", "초대 링크 생성", "만료일", "수락 상태"],
    href: "/system/invites",
    actionLabel: "고객 초대 화면 열기",
  },
  {
    id: "plans",
    title: "요금제·용량",
    description:
      "시스템관리자가 고객별 요금제와 저장용량 override를 조정할 화면입니다.",
    items: ["기본 요금제", "저장용량 한도", "사용자 수 한도", "고객별 override"],
    href: "/system/billing",
    actionLabel: "요금제·용량 화면 열기",
  },
  {
    id: "stats",
    title: "통계",
    description: "시스템 전체 운영 지표와 고객사별 사용량을 볼 화면의 자리입니다.",
    items: ["고객사 수", "활성 고객사", "저장용량", "요금제 분포"],
    href: "/system#system-stats",
    actionLabel: "시스템 통계 확인",
  },
  {
    id: "logs",
    title: "감사 로그",
    description:
      "고객관리자 히스토리와 분리해 시스템관리자의 운영 이벤트를 audit log로 연결할 화면입니다.",
    items: ["권한 변경", "요금제 변경", "용량 변경", "영구 삭제 처리"],
    href: "/system/audit-logs",
    actionLabel: "감사 로그 설계 열기",
  },
];

export const SYSTEM_CONSOLE_QUICK_LINKS = [
  {
    id: "system-companies",
    label: "고객사 승인",
    href: "/system/companies",
    description: "고객사 가입 신청 검토와 회사 생성 승인",
  },
  {
    id: "system-invites",
    label: "고객 초대",
    href: "/system/invites",
    description: "고객사 관리자 초대 링크/QR skeleton",
  },
  {
    id: "system-billing",
    label: "요금제·용량",
    href: "/system/billing",
    description: "고객별 plan과 override skeleton",
  },
  {
    id: "system-stats",
    label: "시스템 통계",
    href: "/system#system-stats",
    description: "고객사별 사용량과 운영 위험 신호",
  },
  {
    id: "storage-usage",
    label: "스토리지 정리",
    href: "/system/storage-usage",
    description: "R2 실제 삭제 후보 확인",
  },
  {
    id: "audit-logs",
    label: "감사 로그",
    href: "/system/audit-logs",
    description: "시스템 운영 이벤트 조회·쓰기 연결",
  },

  {
    id: "system-standards",
    label: "기준정보 관리",
    href: "/system/standards",
    description: "단위·외주공정·생산품 기본 템플릿 표준 설계",
  },
  {
    id: "system-unit-standards",
    label: "단위 표준 관리",
    href: "/system/standards/units",
    description: "시스템 단위 표준 원장 1차 화면",
  },
  {
    id: "system-process-standards",
    label: "외주공정 유형 관리",
    href: "/system/standards/processes",
    description: "시스템 외주공정 유형 원장 1차 화면",
  },
  {
    id: "system-product-template-standards",
    label: "생산품 유형 템플릿",
    href: "/system/standards/product-templates",
    description: "신규 고객사 기본 생산품 유형 템플릿 1차 화면",
  },
  {
    id: "system-standards-seed-status",
    label: "기준정보 seed 상태",
    href: "/system/standards/seed-status",
    description: "DB 기준 기준정보 seed와 활성 항목 수 점검",
  },
  {
    id: "system-standards-regression",
    label: "기준정보 회귀점검",
    href: "/system/standards/regression",
    description: "fallback 혼입과 고객사 연결 무결성 점검",
  },
  {
    id: "system-standards-customer-onboarding",
    label: "고객사 초기 기준정보",
    href: "/system/standards/customer-onboarding",
    description: "신규 고객사 생산품 유형 템플릿 복사 설계",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    href: "/system/category-rules",
    description: "기존 카테고리 추천 규칙 관리",
  },
] as const;

export const SYSTEM_CONSOLE_API_LINKS = [
  {
    id: "companies-api",
    label: "고객사 API",
    path: "/api/system/companies",
    description: "고객사 목록 skeleton",
  },
  {
    id: "stats-api",
    label: "시스템 통계 API",
    path: "/api/system/stats",
    description: "시스템 통계 summary skeleton",
  },
  {
    id: "storage-usage-api",
    label: "저장공간 사용량 API",
    path: "/api/system/storage-usage?companyId=company-sample-customer",
    description: "고객사별 storage usage skeleton",
  },
  {
    id: "audit-logs-api",
    label: "감사 로그 API",
    path: "/api/system/audit-logs",
    description: "후속 버전에서 연결할 시스템 audit log 읽기 API",
  },
  {
    id: "standards-seed-status-api",
    label: "기준정보 seed 상태 API",
    path: "/api/system/standards/seed-status",
    description: "시스템 기준정보 seed 적용 상태 점검",
  },
] as const;
