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
    id: "customers",
    label: "고객사 관리",
    description: "고객사 목록, 고객사 관리자 초대, 가입 신청, 승인·거절, 상태 변경을 한 화면에서 처리합니다.",
    href: "/system/companies",
    statusLabel: "초대·승인",
    tone: "primary",
  },
  {
    id: "storage",
    label: "저장소 관리",
    description: "고객관리자 삭제 요청, 보존기간 경과 후보, R2 실제 삭제 처리 상태를 확인합니다.",
    href: "/system/storage-usage",
    statusLabel: "삭제 후보",
    tone: "warning",
  },
  {
    id: "audit-logs",
    label: "로그",
    description: "고객사 승인, 요금제·용량 변경, 파일 삭제, 권한 변경 같은 시스템 감사 로그를 조회합니다.",
    href: "/system/audit-logs",
    statusLabel: "감사 로그",
    tone: "neutral",
  },
  {
    id: "billing",
    label: "요금제·용량",
    description: "요금제별 기본 용량, 고객사별 저장공간 한도, 사용자 수 제한과 override 정책을 관리합니다.",
    href: "/system/billing",
    statusLabel: "정책 준비",
    tone: "maintenance",
  },
  {
    id: "standards",
    label: "기준정보 관리",
    description: "단위, 공정, 생산품 유형 템플릿처럼 신규 고객사와 작업지시서에서 공유할 기준정보를 관리합니다.",
    href: "/system/standards",
    statusLabel: "기준정보",
    tone: "neutral",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    description: "작업지시서 제목 기반 대분류·품목·세부형태 추천 규칙과 통계 분류 기준을 관리합니다.",
    href: "/system/category-rules",
    statusLabel: "분류 규칙",
    tone: "neutral",
  },
];

export const SYSTEM_CONSOLE_NAVIGATION_SECTIONS: SystemConsoleNavigationSection[] = [
  {
    id: "operations",
    title: "운영 메뉴",
    description: "고객사 운영, 저장소, 로그, 요금제, 기준정보, 카테고리 규칙을 한 곳에서 관리합니다.",
    cards: SYSTEM_CONSOLE_OPERATIONS_NAVIGATION,
  },
];
