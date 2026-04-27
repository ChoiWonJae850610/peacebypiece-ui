export type AdminDashboardRoute = string | null;

export type AdminSummaryCard = {
  label: string;
  value: string;
  href: AdminDashboardRoute;
};

export type AdminDashboardItem = {
  label: string;
  description: string;
  href: AdminDashboardRoute;
};

export type AdminDashboardSection = {
  title: string;
  items: AdminDashboardItem[];
};

export const ADMIN_SUMMARY_CARDS: AdminSummaryCard[] = [
  { label: "진행 중 작지", value: "0", href: "/worker" },
  { label: "검토 대기", value: "0", href: "/worker" },
  { label: "발주 준비", value: "0", href: "/worker" },
  { label: "첨부파일 사용량", value: "0GB / 5GB", href: "/admin/files" },
];

export const ADMIN_DASHBOARD_SECTIONS: AdminDashboardSection[] = [
  {
    title: "통계 / 대시보드",
    items: [
      { label: "통계 화면", description: "작지, 거래처, 생산 흐름, 첨부파일 사용량 지표 확인", href: "/admin/dashboard" },
      { label: "운영 현황", description: "검토 대기, 발주 준비, 완료 흐름을 요약해서 확인", href: "/admin/dashboard" },
    ],
  },
  {
    title: "작업 관리",
    items: [
      { label: "작지 워크스페이스", description: "현재 작업지시서 목록과 상세 화면으로 이동", href: "/worker" },
      { label: "작지 히스토리", description: "상태 변경과 주요 작업 기록 확인", href: "/admin/history" },
      { label: "검토 대기 작지", description: "검토가 필요한 작업지시서 확인", href: "/worker" },
    ],
  },
  {
    title: "기준정보 관리",
    items: [
      { label: "거래처 / 공장 관리", description: "공장, 원단, 부자재, 외주처 정보를 통합 관리", href: "/admin/partners" },
      { label: "단위 관리", description: "원단, 부자재, 생산 수량에 사용할 단위 기준 관리", href: "/admin/units" },
    ],
  },
  {
    title: "파일 / 용량 관리",
    items: [
      { label: "첨부파일 목록", description: "작지별 첨부파일과 대표 이미지 확인", href: "/admin/files" },
      { label: "휴지통", description: "소프트 삭제된 첨부파일 복원 또는 보관 상태 확인", href: "/admin/files" },
      { label: "용량 사용량", description: "첨부파일 저장소 사용량과 추가 요청 관리", href: "/admin/files" },
    ],
  },
  {
    title: "사용자 관리",
    items: [
      { label: "사용자 목록", description: "고객사 사용자와 활성 상태 확인", href: null },
      { label: "초대 / 권한", description: "사용자 초대와 역할 변경 관리", href: null },
      { label: "운영 로그", description: "관리자 작업 이력 확인", href: null },
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
