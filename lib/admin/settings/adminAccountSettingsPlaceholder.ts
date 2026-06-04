export type AdminAccountSettingsMetric = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type AdminAccountSettingsAction = {
  id: string;
  label: string;
  statusLabel: string;
  description: string;
};

export const ADMIN_ACCOUNT_SETTINGS_PLACEHOLDER = {
  title: "계정 설정은 조직 정보와 개인 설정을 분리해서 확인합니다.",
  description:
    "고객관리자 환경설정에서는 회사 계정과 대표 담당자 정보를 읽기 전용으로 확인하고, 개인 이름·언어·테마 같은 항목은 개인 설정 화면에서 다루는 구조로 유지합니다.",
  readOnlyLabel: "읽기 전용",
  metrics: [
    {
      id: "company-name",
      label: "회사 정보",
      value: "현재 고객사",
      description: "실제 운영에서는 companies.name, business_name, status 기준으로 표시합니다.",
    },
    {
      id: "admin-email",
      label: "대표 로그인 이메일",
      value: "Google 로그인 이메일",
      description: "정식 OAuth 연결 후 users.email과 company_members 승인 상태를 함께 표시합니다.",
    },
    {
      id: "account-status",
      label: "계정 상태",
      value: "승인됨",
      description: "승인 대기, 승인됨, 정지됨 상태는 company_members.status 기준으로 연결합니다.",
    },
    {
      id: "personal-settings",
      label: "개인 설정",
      value: "상단 모달",
      description: "프로필과 테마는 상단 사람 아이콘의 개인 설정 모달에서 관리합니다.",
    },
  ] satisfies AdminAccountSettingsMetric[],
  actions: [
    {
      id: "request-company-info-change",
      label: "회사 정보 변경 요청",
      statusLabel: "후속 연결",
      description: "회사명, 사업자명, 대표 담당자 변경은 시스템관리자 검토 요청으로 처리합니다.",
    },
    {
      id: "request-account-deactivation",
      label: "계정 비활성화 요청",
      statusLabel: "후속 연결",
      description: "고객사 폐쇄, 관리자 교체, 계정 정지는 실제 인증 연결 후 별도 승인 흐름으로 분리합니다.",
    },
    {
      id: "open-personal-settings",
      label: "개인 설정으로 이동",
      statusLabel: "연결 가능",
      description: "개인 표시명, 언어, 화면 환경은 조직 설정이 아니라 개인 설정에서 처리합니다.",
    },
  ] satisfies AdminAccountSettingsAction[],
  policyNotes: [
    "조직 설정과 개인 설정을 한 화면에서 섞지 않습니다.",
    "회사 정보 변경은 고객관리자 직접 수정이 아니라 승인 요청 흐름으로 처리합니다.",
    "로그인 이메일은 OAuth provider 기준 식별값이므로 임의 변경하지 않습니다.",
    "탈퇴·비활성화는 작업지시서, 첨부, 감사 로그 보존 정책과 함께 검토해야 합니다.",
  ] as const,
} as const;
