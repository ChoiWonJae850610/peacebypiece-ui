export type SystemConsoleTabId =
  | "overview"
  | "companies"
  | "invites"
  | "plans"
  | "stats"
  | "logs"
  | "storage"
  | "categoryRules";

export type SystemConsoleTab = {
  id: SystemConsoleTabId;
  label: string;
  description: string;
  statusLabel: string;
};

export type SystemConsolePlaceholder = {
  id: Exclude<SystemConsoleTabId, "overview" | "storage" | "categoryRules">;
  title: string;
  description: string;
  items: string[];
};

export const SYSTEM_CONSOLE_TABS: SystemConsoleTab[] = [
  {
    id: "overview",
    label: "전체 현황",
    description: "시스템관리자 콘솔의 현재 운영 상태를 확인합니다.",
    statusLabel: "현재 화면",
  },
  {
    id: "companies",
    label: "고객사 관리",
    description: "고객사, 고객사 관리자, 사용 상태를 관리할 영역입니다.",
    statusLabel: "준비",
  },
  {
    id: "invites",
    label: "고객 초대",
    description: "시스템관리자가 고객사 관리자를 초대할 영역입니다.",
    statusLabel: "준비",
  },
  {
    id: "plans",
    label: "요금제·용량",
    description: "고객별 요금제와 저장 용량 override를 관리할 영역입니다.",
    statusLabel: "준비",
  },
  {
    id: "stats",
    label: "통계",
    description: "고객사, 저장용량, 초대, 요금제 통계를 확인할 영역입니다.",
    statusLabel: "준비",
  },
  {
    id: "logs",
    label: "시스템 로그",
    description: "시스템관리자 작업 이력과 운영 이벤트를 확인할 영역입니다.",
    statusLabel: "준비",
  },
  {
    id: "storage",
    label: "스토리지",
    description: "첨부파일 저장소 정리 기능을 유지합니다.",
    statusLabel: "기존 기능",
  },
  {
    id: "categoryRules",
    label: "카테고리 규칙",
    description: "작업지시서 카테고리 추천 규칙 관리 기능을 유지합니다.",
    statusLabel: "기존 기능",
  },
];

export const SYSTEM_CONSOLE_PLACEHOLDERS: SystemConsolePlaceholder[] = [
  {
    id: "companies",
    title: "고객사 관리",
    description: "SaaS형 테넌트 구조를 위한 고객사 목록, 관리자, 사용 상태 관리 화면의 자리입니다.",
    items: ["고객사 목록", "고객사 관리자", "사용/중지 상태", "고객별 기본 설정"],
  },
  {
    id: "invites",
    title: "고객 초대",
    description: "이메일 발송 전 단계로 초대 링크와 QR 초대 흐름을 붙일 화면의 자리입니다.",
    items: ["고객사 관리자 초대", "초대 링크 생성", "만료일", "수락 상태"],
  },
  {
    id: "plans",
    title: "요금제·용량",
    description: "시스템관리자가 고객별 요금제와 저장용량 override를 조정할 화면의 자리입니다.",
    items: ["기본 요금제", "저장용량 한도", "사용자 수 한도", "고객별 override"],
  },
  {
    id: "stats",
    title: "통계",
    description: "시스템 전체 운영 지표와 고객사별 사용량을 볼 화면의 자리입니다.",
    items: ["고객사 수", "활성 고객사", "저장용량", "초대 수락 현황"],
  },
  {
    id: "logs",
    title: "시스템 로그",
    description: "시스템관리자의 주요 작업 이력을 audit log로 연결할 화면의 자리입니다.",
    items: ["고객사 변경", "요금제 변경", "용량 변경", "초대 링크 생성"],
  },
];
