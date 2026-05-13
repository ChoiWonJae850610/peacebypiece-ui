export type AdminSettingsMenuId = "standards" | "billing" | "account" | "feedback";

export type AdminSettingsMenuTone = "blue" | "amber" | "emerald" | "violet";

export type AdminSettingsMenuItem = {
  id: AdminSettingsMenuId;
  title: string;
  description: string;
  statusLabel: string;
  tone: AdminSettingsMenuTone;
  detailItems: readonly string[];
};

export const ADMIN_SETTINGS_MENU_ITEMS: readonly AdminSettingsMenuItem[] = [
  {
    id: "standards",
    title: "기준정보 설정",
    description: "작업지시서 생성과 협력업체 선택에 쓰는 회사 기준값을 관리합니다.",
    statusLabel: "관리 가능",
    tone: "blue",
    detailItems: ["생산품 유형", "단위 표준", "외주공정 유형"],
  },
  {
    id: "billing",
    title: "요금제·저장공간",
    description: "현재 요금제와 저장공간 한도, 변경 요청 기준을 확인합니다.",
    statusLabel: "읽기 전용",
    tone: "emerald",
    detailItems: ["현재 요금제", "저장공간 한도", "변경 요청"],
  },
  {
    id: "account",
    title: "계정 정보",
    description: "회사 계정과 개인 설정의 분리 기준을 확인합니다.",
    statusLabel: "읽기 전용",
    tone: "amber",
    detailItems: ["대표 계정", "개인 설정", "관리자 교체"],
  },
  {
    id: "feedback",
    title: "개발 건의",
    description: "개선 요청과 오류 제보를 시스템 개발자에게 전달합니다.",
    statusLabel: "이메일 접수",
    tone: "violet",
    detailItems: ["기능 건의", "오류 제보", "개선 요청"],
  },
] as const;

export const ADMIN_SETTINGS_NOTICE_BY_ID: Record<Exclude<AdminSettingsMenuId, "standards">, { title: string; description: string; nextStep: string; items: readonly string[] }> = {
  billing: {
    title: "요금제·결제는 읽기 전용으로 확인합니다.",
    description: "정식 결제 연동 전까지 고객관리자는 현재 요금제, 저장공간 한도, 변경 요청 기준만 확인하고 실제 수정은 시스템관리자에서 처리합니다.",
    nextStep: "요금제 변경, 저장공간 증설, 청구 정보 변경은 시스템관리자 관리 화면과 연결한 뒤 활성화합니다.",
    items: ["현재 요금제 확인", "저장공간 한도 확인", "요금제 변경 요청", "청구 정보 문의"],
  },
  account: {
    title: "계정 설정은 읽기 전용으로 확인합니다.",
    description: "회사 정보, 대표 로그인 이메일, 계정 상태를 확인하고 개인 설정과 조직 설정을 분리하는 기준을 안내합니다.",
    nextStep: "회사 정보 변경, 계정 비활성화, 관리자 교체 요청은 정식 인증/승인 연결 후 활성화합니다.",
    items: ["회사 정보 확인", "대표 로그인 이메일 확인", "개인 설정 분리", "계정 비활성화 요청"],
  },
  feedback: {
    title: "개발 건의는 이메일로 접수합니다.",
    description: "고객관리자가 기능 개선 요청, 오류 제보, 업무 흐름 불편사항을 이메일로 전달할 수 있는 1차 접수 방식입니다.",
    nextStep: "정식 feature_requests DB와 시스템관리자 검토 화면은 후속 버전에서 확장합니다.",
    items: ["기능 개선 건의", "업무 흐름 불편사항", "오류 제보", "첨부/캡처 전달"],
  },
};

export function getAdminSettingsMenuItem(id: AdminSettingsMenuId): AdminSettingsMenuItem | undefined {
  return ADMIN_SETTINGS_MENU_ITEMS.find((item) => item.id === id);
}
