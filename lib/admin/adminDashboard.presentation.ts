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
  { label: "진행 중 작지", value: "0", href: "/worker", description: "현재 운영 중인 전체 작업지시서", accent: "bg-blue-50 text-blue-700" },
  { label: "검토 대기", value: "0", href: "/worker", description: "관리자 확인이 필요한 작지", accent: "bg-amber-50 text-amber-700" },
  { label: "발주 준비", value: "0", href: "/worker", description: "발주 액션 전 점검 대상", accent: "bg-violet-50 text-violet-700" },
  { label: "첨부파일 사용량", value: "0GB / 5GB", href: "/admin/files", description: "고객사 저장소 사용 현황", accent: "bg-emerald-50 text-emerald-700" },
];

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  { label: "대시보드", href: "/admin", icon: "⌂", active: true },
  { label: "작지 화면", href: "/worker", icon: "▣" },
  { label: "통계", href: "/admin/dashboard", icon: "◒" },
  { label: "기준정보", href: "/admin/partners", icon: "◇" },
  { label: "파일/용량", href: "/admin/files", icon: "◫" },
  { label: "단위 관리", href: "/admin/units", icon: "㎝" },
  { label: "환경설정", href: null, icon: "⚙" },
];

export const ADMIN_DASHBOARD_SECTIONS: AdminDashboardSection[] = [
  {
    title: "통계 / 대시보드",
    items: [
      { label: "통계 화면", description: "작지, 거래처, 생산 흐름, 첨부파일 사용량 지표 확인", href: "/admin/dashboard", icon: "◒" },
      { label: "운영 현황", description: "검토 대기, 발주 준비, 완료 흐름을 요약해서 확인", href: "/admin/dashboard", icon: "▦" },
    ],
  },
  {
    title: "작업 관리",
    items: [
      { label: "작지 워크스페이스", description: "현재 작업지시서 목록과 상세 화면으로 이동", href: "/worker", icon: "▣" },
      { label: "작지 히스토리", description: "상태 변경과 주요 작업 기록 확인", href: "/admin/history", icon: "↺" },
      { label: "검토 대기 작지", description: "검토가 필요한 작업지시서 확인", href: "/worker", icon: "✓" },
    ],
  },
  {
    title: "기준정보 관리",
    items: [
      { label: "거래처 / 공장 관리", description: "공장, 원단, 부자재, 외주처 정보를 통합 관리", href: "/admin/partners", icon: "◇" },
      { label: "단위 관리", description: "원단, 부자재, 생산 수량에 사용할 단위 기준 관리", href: "/admin/units", icon: "㎝" },
    ],
  },
  {
    title: "파일 / 용량 관리",
    items: [
      { label: "첨부파일 목록", description: "작지별 첨부파일과 대표 이미지 확인", href: "/admin/files", icon: "▤" },
      { label: "휴지통", description: "소프트 삭제된 첨부파일 복원 또는 보관 상태 확인", href: "/admin/files", icon: "♲" },
      { label: "용량 사용량", description: "첨부파일 저장소 사용량과 추가 요청 관리", href: "/admin/files", icon: "◫" },
    ],
  },
  {
    title: "사용자 관리",
    items: [
      { label: "사용자 목록", description: "고객사 사용자와 활성 상태 확인", href: null, icon: "○" },
      { label: "초대 / 권한", description: "사용자 초대와 역할 변경 관리", href: null, icon: "+" },
      { label: "운영 로그", description: "관리자 작업 이력 확인", href: null, icon: "≡" },
    ],
  },
];

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
