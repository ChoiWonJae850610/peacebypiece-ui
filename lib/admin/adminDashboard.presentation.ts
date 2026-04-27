export type AdminDashboardRoute = string | null;

export type AdminSummaryCard = {
  label: string;
  value: string;
  href: AdminDashboardRoute;
  description?: string;
  accent?: string;
};

export type AdminDashboardItem = {
  label: string;
  description: string;
  href: AdminDashboardRoute;
  icon: string;
  statusLabel?: string;
};

export type AdminNavigationItem = {
  label: string;
  href: AdminDashboardRoute;
  icon: string;
  active?: boolean;
};

export type AdminDashboardSection = {
  title: string;
  items: AdminDashboardItem[];
};

export const ADMIN_SUMMARY_CARDS: AdminSummaryCard[] = [
  { label: "작업중인 작지", value: "0", href: "/worker", description: "발주 전 작업 대상", accent: "bg-blue-50 text-blue-700" },
  { label: "검토 대기", value: "0", href: "/worker", description: "관리자 확인 필요", accent: "bg-amber-50 text-amber-700" },
  { label: "입고 대기", value: "0", href: "/worker", description: "발주 이후 검수 전", accent: "bg-violet-50 text-violet-700" },
  { label: "첨부파일 사용량", value: "0GB / 5GB", href: "/admin/files", description: "저장소 사용 현황", accent: "bg-emerald-50 text-emerald-700" },
];


export type AdminDashboardPeriod = {
  label: string;
  active: boolean;
};

export type AdminDashboardStagePoint = {
  label: string;
  value: number;
};

export type AdminDashboardInsightItem = {
  label: string;
  value: string;
  description: string;
};

export const ADMIN_DASHBOARD_PERIODS: AdminDashboardPeriod[] = [
  { label: "오늘", active: false },
  { label: "이번주", active: false },
  { label: "이번달", active: true },
];

export const ADMIN_DASHBOARD_STAGE_FLOW: AdminDashboardStagePoint[] = [
  { label: "작성", value: 0 },
  { label: "검토", value: 0 },
  { label: "발주", value: 0 },
  { label: "입고", value: 0 },
  { label: "완료", value: 0 },
];

export const ADMIN_DASHBOARD_DISTRIBUTION: AdminDashboardStagePoint[] = [
  { label: "작업중", value: 0 },
  { label: "검토대기", value: 0 },
  { label: "입고대기", value: 0 },
  { label: "완료", value: 0 },
];

export const ADMIN_DASHBOARD_INSIGHT_ITEMS: AdminDashboardInsightItem[] = [
  { label: "오늘 생성", value: "0", description: "오늘 새로 등록된 작지" },
  { label: "검토 지연", value: "0", description: "관리자 확인이 늦어진 작지" },
  { label: "입고 지연", value: "0", description: "발주 이후 검수가 필요한 작지" },
];

export function getAdminDashboardMaxStageValue(): number {
  return Math.max(1, ...ADMIN_DASHBOARD_STAGE_FLOW.map((item) => item.value));
}

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  { label: "대시보드", href: "/admin", icon: "⌂" },
  { label: "작지 화면", href: "/worker", icon: "▣" },
  { label: "히스토리", href: "/admin/history", icon: "◷" },
  { label: "통계", href: "/admin/dashboard", icon: "▥" },
  { label: "기준정보", href: "/admin/partners", icon: "▦" },
  { label: "파일/용량", href: "/admin/files", icon: "▤" },
  { label: "단위 관리", href: "/admin/units", icon: "㎝" },
  { label: "환경설정", href: "/admin/settings", icon: "⚙" },
];

export const ADMIN_DASHBOARD_SECTIONS: AdminDashboardSection[] = [
  {
    title: "작지 운영",
    items: [
      { label: "검토 대기 작지", description: "관리자 확인이 필요한 작지를 확인", href: "/worker", icon: "✓" },
      { label: "작업중인 작지", description: "발주 전 단계의 작업 흐름 확인", href: "/worker", icon: "□" },
      { label: "작지 히스토리", description: "상태 변경과 주요 작업 기록 확인", href: "/admin/history", icon: "◷" },
    ],
  },
  {
    title: "운영 기준",
    items: [
      { label: "거래처 / 공장 관리", description: "공장, 원단, 부자재, 외주처 정보 관리", href: "/admin/partners", icon: "▦" },
      { label: "단위 관리", description: "원단, 부자재, 생산 수량 단위 기준 관리", href: "/admin/units", icon: "㎝" },
      { label: "환경설정", description: "파일 정책과 알림 이벤트 설정 관리", href: "/admin/settings", icon: "⚙" },
    ],
  },
];

export const ADMIN_DASHBOARD_PRIMARY_SECTION_COUNT = 2;

export type AdminDashboardStatusPanel = {
  title: string;
  items: AdminDashboardItem[];
};

export const ADMIN_DASHBOARD_STATUS_PANEL: AdminDashboardStatusPanel = {
  title: "파일 / 시스템 상태",
  items: [
    { label: "파일/용량 관리", description: "첨부파일 사용량, 휴지통, purge 상태 확인", href: "/admin/files", icon: "▤" },
    { label: "통계 화면", description: "작지, 거래처, 파일 사용량 지표 확인", href: "/admin/dashboard", icon: "▥" },
    { label: "알림 설정", description: "검토, 발주, 용량 이벤트 기준 설정", href: "/admin/settings", icon: "⚙" },
  ],
};

export function getAdminDashboardPrimarySections(): AdminDashboardSection[] {
  return ADMIN_DASHBOARD_SECTIONS.slice(0, ADMIN_DASHBOARD_PRIMARY_SECTION_COUNT);
}

export function getAdminDashboardStatusPanel(): AdminDashboardStatusPanel {
  return ADMIN_DASHBOARD_STATUS_PANEL;
}

export const ADMIN_STAT_SUMMARIES: AdminSummaryCard[] = [
  { label: "전체 작지", value: "0", href: "/worker" },
  { label: "검토 대기", value: "0", href: "/worker" },
  { label: "완료 작지", value: "0", href: "/worker" },
  { label: "첨부파일 사용량", value: "0GB / 5GB", href: null },
];

export const ADMIN_DASHBOARD_PLACEHOLDERS = [
  { title: "작지 흐름", description: "작성중, 검토 대기, 발주 준비, 완료 상태별 집계 영역" },
  { title: "거래처 운영", description: "공장, 원단, 부자재, 외주처 사용 현황 집계 영역" },
  { title: "파일 / 용량", description: "첨부파일 사용량, 휴지통 보관량, 용량 추가 요청 진입 영역" },
] as const;

export const ADMIN_UNIT_PLACEHOLDERS = [
  { label: "길이", examples: "yd, m, cm" },
  { label: "수량", examples: "개, 장, 벌, set" },
  { label: "무게", examples: "kg, g" },
] as const;

export function getAdminNavigationItems(activeHref: string): AdminNavigationItem[] {
  return ADMIN_NAVIGATION_ITEMS.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}

export type AdminStandardSummaryCard = {
  label: string;
  value: string;
  badge: string;
  description: string;
  accent: string;
};

export type AdminStandardGroup = {
  label: string;
  description: string;
  icon: string;
  href: AdminDashboardRoute;
  statusLabel: string;
};

export const ADMIN_STANDARD_SUMMARY_CARDS: AdminStandardSummaryCard[] = [
  { label: "단위", value: "3", badge: "사용중", description: "길이, 수량, 무게 단위 기준", accent: "bg-blue-50 text-blue-700" },
  { label: "코드", value: "4", badge: "정리", description: "상태, 분류, 공정, 파일 코드 기준", accent: "bg-violet-50 text-violet-700" },
  { label: "품목", value: "3", badge: "기본", description: "원단, 부자재, 완제품 품목 기준", accent: "bg-emerald-50 text-emerald-700" },
  { label: "미사용", value: "0", badge: "대기", description: "비활성 기준값 검토 영역", accent: "bg-stone-100 text-stone-600" },
];

export const ADMIN_STANDARD_GROUPS: AdminStandardGroup[] = [
  { label: "단위 관리", description: "원단 길이, 부자재 수량, 생산 수량에 사용할 단위 기준을 관리합니다.", icon: "㎝", href: "/admin/units", statusLabel: "현재" },
  { label: "코드 관리", description: "상태 코드, 분류 코드, 공정 코드처럼 화면 공통으로 쓰는 값을 정리합니다.", icon: "#", href: null, statusLabel: "준비중" },
  { label: "품목 관리", description: "원단, 부자재, 완제품 품목명을 운영 기준에 맞게 관리합니다.", icon: "▤", href: null, statusLabel: "준비중" },
  { label: "외주공정 기준", description: "나염, 자수, 워싱, 후가공 등 외주공정 선택 기준을 관리합니다.", icon: "⇄", href: "/admin/partners", statusLabel: "이동" },
  { label: "거래처 분류", description: "공장, 원단, 부자재, 외주처 분류 기준을 거래처 관리와 연결합니다.", icon: "◇", href: "/admin/partners", statusLabel: "이동" },
  { label: "기본값 복원", description: "초기 운영 기준값으로 되돌리는 관리 액션 영역입니다.", icon: "↺", href: null, statusLabel: "준비중" },
];

export type AdminSettingsSummaryCard = {
  label: string;
  value: string;
  badge: string;
  description: string;
  accent: string;
};

export type AdminSettingsGroup = {
  label: string;
  description: string;
  icon: string;
  statusLabel: string;
};

export type AdminThemeOption = {
  label: string;
  value: string;
  className: string;
  description: string;
};

export type AdminLanguageOption = {
  label: string;
  value: string;
  statusLabel: string;
};

export type AdminPolicyPreviewItem = {
  label: string;
  value: string;
  statusLabel: string;
};

export const ADMIN_SETTINGS_SUMMARY_CARDS: AdminSettingsSummaryCard[] = [
  { label: "테마", value: "Blue", badge: "기본", description: "고객사별 관리자 화면 색상 기준", accent: "bg-blue-50 text-blue-700" },
  { label: "언어", value: "한국어", badge: "현재", description: "관리자 화면 기본 표시 언어", accent: "bg-emerald-50 text-emerald-700" },
  { label: "파일 정책", value: "15일", badge: "보관", description: "휴지통 보관 및 purge 기준", accent: "bg-amber-50 text-amber-700" },
  { label: "알림", value: "ON", badge: "운영", description: "검토/발주/용량 알림 정책", accent: "bg-violet-50 text-violet-700" },
];

export const ADMIN_SETTINGS_GROUPS: AdminSettingsGroup[] = [
  { label: "테마 설정", description: "고객사별 accent color, 화면 밀도, 다크모드 적용 여부를 관리합니다.", icon: "◉", statusLabel: "UI" },
  { label: "언어 설정", description: "한국어/영어 표시 기준과 향후 다국어 확장 기준을 분리합니다.", icon: "文", statusLabel: "i18n" },
  { label: "파일 정책", description: "소프트 삭제, 휴지통 포함, 자동 삭제 기간, 용량 경고 기준을 저장합니다.", icon: "▤", statusLabel: "정책" },
  { label: "알림 정책", description: "검토 요청, 발주 준비, 용량 초과, 백업 상태 알림 기준을 관리합니다.", icon: "◌", statusLabel: "알림" },
];

export const ADMIN_THEME_OPTIONS: AdminThemeOption[] = [
  { label: "Blue", value: "blue", className: "bg-blue-500", description: "기본 관리자 색상" },
  { label: "Emerald", value: "emerald", className: "bg-emerald-500", description: "차분한 운영 색상" },
  { label: "Violet", value: "violet", className: "bg-violet-500", description: "브랜드 강조 색상" },
  { label: "Amber", value: "amber", className: "bg-amber-400", description: "경고/주의 강조 색상" },
  { label: "Slate", value: "slate", className: "bg-slate-500", description: "무채색 운영 색상" },
];

export const ADMIN_LANGUAGE_OPTIONS: AdminLanguageOption[] = [
  { label: "한국어", value: "ko", statusLabel: "현재" },
  { label: "English", value: "en", statusLabel: "준비" },
  { label: "日本語", value: "ja", statusLabel: "준비" },
  { label: "Français", value: "fr", statusLabel: "준비" },
];

export const ADMIN_FILE_POLICY_PREVIEW_ITEMS: AdminPolicyPreviewItem[] = [
  { label: "소프트 삭제", value: "사용", statusLabel: "ON" },
  { label: "휴지통 포함", value: "사용량 계산 포함", statusLabel: "ON" },
  { label: "자동 삭제 기간", value: "15일", statusLabel: "기본" },
  { label: "용량 경고 기준", value: "80%", statusLabel: "경고" },
];
