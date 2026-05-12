export type SystemConsoleNavigationTone = "primary" | "neutral" | "warning" | "maintenance";

export type SystemConsoleNavigationCard = {
  id: string;
  label: string;
  description: string;
  href: string;
  statusLabel: string;
  tone: SystemConsoleNavigationTone;
};

export type SystemConsoleNavigationSection = {
  id: string;
  title: string;
  description: string;
  cards: SystemConsoleNavigationCard[];
};

export const SYSTEM_CONSOLE_OPERATIONS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "companies",
    label: "고객사 관리",
    description: "고객사 가입 신청 검토, 회사 생성, 최초 고객관리자 승인을 처리합니다.",
    href: "/system/companies",
    statusLabel: "승인 연결",
    tone: "primary",
  },
  {
    id: "invites",
    label: "고객사 초대",
    description: "시스템관리자가 고객사 관리자 초대 링크를 생성하고 초대 흐름을 확인합니다.",
    href: "/system/invites",
    statusLabel: "초대 연결",
    tone: "primary",
  },
  {
    id: "storage",
    label: "저장소 관리",
    description: "고객관리자 삭제 요청과 보존기간이 지난 R2 실제 삭제 후보를 처리합니다.",
    href: "/system/storage-usage",
    statusLabel: "운영 연결",
    tone: "warning",
  },
  {
    id: "audit-logs",
    label: "감사 로그",
    description: "초대, 승인, 권한, 저장소, 요금제 변경 이벤트를 시스템관리자 기준으로 조회합니다.",
    href: "/system/audit-logs",
    statusLabel: "로그 연결",
    tone: "neutral",
  },
  {
    id: "billing",
    label: "요금제·용량",
    description: "고객사별 요금제, 저장공간 한도, 사용자 수 한도 override 정책을 관리합니다.",
    href: "/system/billing",
    statusLabel: "정책 준비",
    tone: "maintenance",
  },
  {
    id: "standards",
    label: "기준정보 관리",
    description: "단위, 외주공정, 생산품 유형 템플릿 같은 시스템 기본 기준정보를 관리합니다.",
    href: "/system/standards",
    statusLabel: "기준정보",
    tone: "neutral",
  },
];

export const SYSTEM_CONSOLE_MAINTENANCE_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "standards-seed-status",
    label: "기준정보 seed 상태",
    description: "DB 기준정보 seed 적용 상태와 활성 항목 수를 점검합니다.",
    href: "/system/standards/seed-status",
    statusLabel: "점검",
    tone: "maintenance",
  },
  {
    id: "standards-regression",
    label: "기준정보 회귀점검",
    description: "fallback 혼입, seed 부족, 고객사 연결 무결성을 확인합니다.",
    href: "/system/standards/regression",
    statusLabel: "회귀",
    tone: "maintenance",
  },
  {
    id: "customer-onboarding-standards",
    label: "고객사 초기 기준정보",
    description: "신규 고객사 생성 시 복사되는 초기 기준정보 템플릿을 확인합니다.",
    href: "/system/standards/customer-onboarding",
    statusLabel: "초기화",
    tone: "maintenance",
  },
  {
    id: "access-checkpoint",
    label: "초대·권한 체크포인트",
    description: "멤버 초대, 고객사 초대, 승인 대기, 권한 제한 흐름을 점검합니다.",
    href: "/system/access-checkpoint",
    statusLabel: "체크",
    tone: "maintenance",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    description: "작업지시서 제목 기반 추천 분류 규칙을 관리합니다.",
    href: "/system/category-rules",
    statusLabel: "규칙",
    tone: "neutral",
  },
];

export const SYSTEM_CONSOLE_NAVIGATION_SECTIONS: SystemConsoleNavigationSection[] = [
  {
    id: "operations",
    title: "운영 메뉴",
    description: "실제 운영자가 가장 먼저 사용하는 시스템관리자 기능입니다.",
    cards: SYSTEM_CONSOLE_OPERATIONS_NAVIGATION,
  },
  {
    id: "maintenance",
    title: "관리·점검 메뉴",
    description: "기준정보, 권한, 회귀점검처럼 운영 전후에 확인하는 보조 기능입니다.",
    cards: SYSTEM_CONSOLE_MAINTENANCE_NAVIGATION,
  },
];
