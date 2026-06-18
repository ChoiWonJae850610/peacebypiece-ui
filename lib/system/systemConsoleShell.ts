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
    id: "account-requests",
    label: "계정 요청 검토",
    description: "회사 정보 변경과 계정 비활성화 요청을 시스템관리자 기준으로 검토합니다.",
    href: "/system/account-requests",
    statusLabel: "요청 검토",
    tone: "neutral",
  },
  {
    id: "billing-operations",
    label: "구독·결제 운영",
    description: "고객사 요금제, 결제 상태, 증빙 처리 현황을 한곳에서 확인합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
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
    id: "account-requests",
    label: "회사 계정 요청",
    description: "고객사 관리자가 접수한 회사 정보 변경과 계정 비활성화 요청을 검토합니다.",
    href: "/system/account-requests",
    statusLabel: "요청 검토",
    tone: "primary",
  },
  {
    id: "customer-subscriptions",
    label: "고객사 구독 관리",
    description: "고객사별 요금제, 구독 상태, 다음 결제일, 서비스 중지·재개 여부를 관리합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
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
    description: "요금제 이름, 저장공간 한도, 월 요금, 사용 여부를 시스템 기준으로 관리합니다.",
    href: "/system/billing",
    statusLabel: "정책 관리",
    tone: "maintenance",
  },
  {
    id: "payment-methods",
    label: "결제수단 관리",
    description: "카드사, 카드 마지막 4자리, 결제수단 상태를 안전한 결제 정보만으로 관리합니다.",
    href: "/system/billing",
    statusLabel: "카드 중심",
    tone: "neutral",
  },
  {
    id: "payment-history",
    label: "결제내역",
    description: "승인번호, 결제일, 결제금액, 결제상태, 영수증 정보를 고객사 단위로 조회합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
    tone: "neutral",
  },
  {
    id: "payment-failures",
    label: "결제 실패·미납",
    description: "결제 실패 사유, 재결제 필요 여부, 미납 상태, 서비스 제한 여부를 확인합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
    tone: "warning",
  },
  {
    id: "refunds",
    label: "환불 관리",
    description: "환불 요청, 환불 사유, 환불 금액, 환불 상태를 별도 운영 흐름으로 관리합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
    tone: "neutral",
  },
  {
    id: "evidence",
    label: "증빙 관리",
    description: "카드매출전표, 세금계산서, 발행 상태와 요청 상태를 관리합니다.",
    href: "/system/billing",
    statusLabel: "증빙",
    tone: "neutral",
  },
];

export const SYSTEM_CONSOLE_PLATFORM_OPERATIONS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "audit-logs",
    label: "시스템 감사로그",
    description: "고객사 승인, 요금제 변경, 결제·환불 처리, 저장소 삭제, 권한 변경, 시스템 설정 변경 이력을 조회합니다.",
    href: "/system/audit-logs",
    statusLabel: "감사 로그",
    tone: "neutral",
  },
  {
    id: "service-documents",
    label: "서비스 문서 관리",
    description: "이용약관, 개인정보처리방침, 환불정책, 데이터 보관·삭제정책, 요금제 정책, 공지사항을 관리합니다.",
    href: "/system/standards",
    statusLabel: "운영 예정",
    tone: "maintenance",
  },
  {
    id: "settlement-export",
    label: "정산자료 출력",
    description: "기간별 매출, 공급가액, 부가세, 합계, 고객사별 매출, 증빙 발행 상태를 출력합니다.",
    href: "/system/billing",
    statusLabel: "운영 예정",
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
    description: "카드결제 중심 운영에 필요한 요금제, 결제수단, 결제내역, 실패·미납, 환불, 증빙 메뉴를 분리합니다.",
    cards: SYSTEM_CONSOLE_BILLING_OPERATIONS_NAVIGATION,
  },
  {
    id: "platform-operations",
    title: "시스템 운영 기준",
    description: "감사로그, 서비스 문서, 정산자료, 기준정보, 카테고리 규칙을 시스템관리자 영역으로 분리합니다.",
    cards: SYSTEM_CONSOLE_PLATFORM_OPERATIONS_NAVIGATION,
  },
];


export const SYSTEM_CONSOLE_INTERNAL_TOOLS_NAVIGATION: SystemConsoleNavigationCard[] = [
  {
    id: "dev-test-console",
    label: "테스트 콘솔",
    description: "테스트 회사·역할·시스템관리자 컨텍스트를 전환하고 원래 세션으로 복구합니다.",
    href: "/dev/test-console",
    statusLabel: "DEV·TEST",
    tone: "warning",
  },
  {
    id: "wafl-ui",
    label: "WAFL UI",
    description: "WAFL 공통 컴포넌트와 디자인 시스템의 실제 표시 상태를 확인합니다.",
    href: "/ui",
    statusLabel: "내부 도구",
    tone: "maintenance",
  },
  {
    id: "functions",
    label: "Functions",
    description: "테스트·시뮬레이터·자동화 기능과 실행 가능 상태를 확인합니다.",
    href: "/functions",
    statusLabel: "내부 도구",
    tone: "neutral",
  },
];
