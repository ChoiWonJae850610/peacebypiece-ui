export type AdminSettingsMenuId = "standards" | "notifications" | "billing" | "account" | "feedback";

export type AdminSettingsMenuTone = "stone" | "blue" | "amber" | "emerald" | "violet";

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
    tone: "stone",
    detailItems: ["생산품 유형", "단위 표준", "외주공정 유형"],
  },
  {
    id: "notifications",
    title: "알림 정책",
    description: "검토요청, 납기 지연, 저장소 용량, 권한 변경 알림 기준을 준비합니다.",
    statusLabel: "개발중",
    tone: "amber",
    detailItems: ["검토요청 알림", "납기/저장소 알림", "권한 변경 알림"],
  },
  {
    id: "billing",
    title: "요금제·결제",
    description: "현재 요금제와 저장공간 한도를 확인하고 변경 요청 흐름을 준비합니다.",
    statusLabel: "읽기 전용",
    tone: "blue",
    detailItems: ["현재 고객사 조회", "저장공간 한도", "변경 요청"],
  },
  {
    id: "account",
    title: "계정 설정",
    description: "회사 계정 정보와 개인 설정 분리 기준을 읽기 전용으로 확인합니다.",
    statusLabel: "읽기 전용",
    tone: "emerald",
    detailItems: ["회사 정보", "로그인 이메일", "개인 설정"],
  },
  {
    id: "feedback",
    title: "개발 건의",
    description: "시스템 개발자에게 개선 요청과 기능 건의를 전달할 영역입니다.",
    statusLabel: "이메일 접수",
    tone: "violet",
    detailItems: ["기능 건의", "오류 제보", "개선 요청"],
  },
] as const;

export const ADMIN_SETTINGS_NOTICE_BY_ID: Record<Exclude<AdminSettingsMenuId, "standards">, { title: string; description: string; nextStep: string; items: readonly string[] }> = {
  notifications: {
    title: "알림 정책은 개발중입니다.",
    description: "검토요청, 납기 지연, 저장소 용량, 권한 변경 알림을 순차적으로 지원할 예정입니다.",
    nextStep: "2026년 하반기 이후 순차 적용 예정입니다.",
    items: ["검토요청/검토완료 알림", "납기 지연 알림", "저장소 용량 알림", "권한 변경 알림"],
  },
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
