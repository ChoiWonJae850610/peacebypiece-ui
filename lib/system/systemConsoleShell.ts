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

export const SYSTEM_CONSOLE_HERO_OPERATION_CARDS: SystemConsoleNavigationCard[] = [
  {
    id: "companies",
    label: "고객사 운영",
    description: "가입 신청, 고객사 관리자 초대, 승인·거절, 서비스 상태 변경을 먼저 확인합니다.",
    href: "/system/companies",
    statusLabel: "초대·승인",
    tone: "primary",
  },
  {
    id: "billing-operations",
    label: "구독·결제 운영",
    description: "요금제, 구독 상태, 카드결제, 결제 실패, 증빙 관리 화면으로 이어질 운영 진입점입니다.",
    href: "/system/billing",
    statusLabel: "설계 중",
    tone: "maintenance",
  },
  {
    id: "storage",
    label: "저장소 삭제",
    description: "삭제 요청과 R2 처리 후보를 점검합니다.",
    href: "/system/storage-usage",
    statusLabel: "Purge",
    tone: "warning",
  },
];

export const SYSTEM_CONSOLE_CUSTOMER_OPERATIONS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "customers",
    label: "고객사 관리",
    description: "고객사 목록, 고객사 관리자 초대, 가입 신청, 승인·거절, 상태 변경을 한 화면에서 처리합니다.",
    href: "/system/companies",
    statusLabel: "초대·승인",
    tone: "primary",
  },
  {
    id: "customer-subscriptions",
    label: "고객사 구독 관리",
    description: "고객사별 요금제, trial 기간, 구독 상태, 다음 결제일, 서비스 중지·재개 정책을 관리할 영역입니다.",
    href: "/system/billing",
    statusLabel: "준비 중",
    tone: "maintenance",
  },
  {
    id: "storage",
    label: "저장소 관리",
    description: "고객관리자 삭제 요청, 보존기간 경과 후보, R2 실제 삭제 처리 상태를 확인합니다.",
    href: "/system/storage-usage",
    statusLabel: "삭제 후보",
    tone: "warning",
  },
];

export const SYSTEM_CONSOLE_BILLING_OPERATIONS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "plans",
    label: "요금제 관리",
    description: "요금제 생성·수정, 저장공간 한도, 월 요금, 사용 여부, trial 정책을 시스템 기준으로 관리합니다.",
    href: "/system/billing",
    statusLabel: "정책 준비",
    tone: "maintenance",
  },
  {
    id: "payment-methods",
    label: "결제수단 관리",
    description: "PG사, customerKey, billingKey, 카드사, 카드 마지막 4자리, 결제수단 상태를 저장 가능 데이터만으로 관리합니다.",
    href: "/system/billing",
    statusLabel: "카드 중심",
    tone: "neutral",
  },
  {
    id: "payment-history",
    label: "결제내역",
    description: "PG 거래번호, 승인번호, 결제일, 결제금액, 결제상태, 영수증 URL을 고객사 단위로 조회할 영역입니다.",
    href: "/system/billing",
    statusLabel: "준비 중",
    tone: "neutral",
  },
  {
    id: "payment-failures",
    label: "결제 실패·미납",
    description: "결제 실패 사유, 재결제 필요 여부, 미납 상태, 서비스 제한 여부를 운영자가 확인할 영역입니다.",
    href: "/system/billing",
    statusLabel: "준비 중",
    tone: "warning",
  },
  {
    id: "refunds",
    label: "환불 관리",
    description: "환불 요청, 환불 사유, 환불 금액, PG 환불 거래번호, 환불 상태를 별도 운영 흐름으로 분리합니다.",
    href: "/system/billing",
    statusLabel: "준비 중",
    tone: "neutral",
  },
  {
    id: "evidence",
    label: "증빙 관리",
    description: "카드매출전표, 세금계산서, 현금영수증, 수동증빙, 발행 상태, 요청 상태를 관리할 영역입니다.",
    href: "/system/billing",
    statusLabel: "증빙",
    tone: "neutral",
  },
];

export const SYSTEM_CONSOLE_PLATFORM_OPERATIONS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "audit-logs",
    label: "시스템 감사로그",
    description: "고객사 승인, 요금제 변경, 결제·환불 처리, 저장소 purge, 권한 변경, 시스템 설정 변경 이력을 조회합니다.",
    href: "/system/audit-logs",
    statusLabel: "감사 로그",
    tone: "neutral",
  },
  {
    id: "service-documents",
    label: "서비스 문서 관리",
    description: "이용약관, 개인정보처리방침, 환불정책, 데이터 보관·삭제정책, 요금제 정책, 공지사항을 관리할 영역입니다.",
    href: "/system/standards",
    statusLabel: "준비 중",
    tone: "maintenance",
  },
  {
    id: "settlement-export",
    label: "정산자료 출력",
    description: "기간별 매출, 공급가액, 부가세, 합계, 고객사별 매출, 증빙 발행 상태를 출력할 영역입니다.",
    href: "/system/billing",
    statusLabel: "준비 중",
    tone: "neutral",
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
    id: "customer-operations",
    title: "고객사 운영",
    description: "고객사 승인, 구독 상태, 저장소 삭제 요청을 실제 운영 순서에 맞춰 확인합니다.",
    cards: SYSTEM_CONSOLE_CUSTOMER_OPERATIONS_NAVIGATION,
  },
  {
    id: "billing-operations",
    title: "요금·결제·증빙",
    description: "카드결제 중심 SaaS 운영에 필요한 요금제, 결제수단, 결제내역, 실패·미납, 환불, 증빙 메뉴를 분리합니다.",
    cards: SYSTEM_CONSOLE_BILLING_OPERATIONS_NAVIGATION,
  },
  {
    id: "platform-operations",
    title: "시스템 운영 기준",
    description: "감사로그, 서비스 문서, 정산자료, 기준정보, 카테고리 규칙을 시스템관리자 영역으로 분리합니다.",
    cards: SYSTEM_CONSOLE_PLATFORM_OPERATIONS_NAVIGATION,
  },
];
