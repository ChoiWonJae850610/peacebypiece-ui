export type SystemCustomerInviteStepStatus = "ready" | "planned" | "locked";

export interface SystemCustomerInviteStep {
  id: string;
  title: string;
  description: string;
  status: SystemCustomerInviteStepStatus;
  statusLabel: string;
}

export interface SystemCustomerInviteField {
  id: string;
  label: string;
  value: string;
  description: string;
}

export const SYSTEM_CUSTOMER_INVITE_STEPS: SystemCustomerInviteStep[] = [
  {
    id: "select-company",
    title: "고객사 선택",
    description: "기존 고객사를 선택하거나 고객사 생성 흐름과 연결할 준비 영역입니다.",
    status: "ready",
    statusLabel: "skeleton",
  },
  {
    id: "admin-email",
    title: "고객관리자 이메일 입력",
    description: "이메일 발송 전 단계에서는 입력값과 초대 링크 생성 정책만 먼저 고정합니다.",
    status: "ready",
    statusLabel: "skeleton",
  },
  {
    id: "link-create",
    title: "초대 링크 생성",
    description: "0.9.63 초대 링크 생성 API와 연결될 액션 자리입니다.",
    status: "planned",
    statusLabel: "API 예정",
  },
  {
    id: "qr",
    title: "QR 표시",
    description: "초대 링크를 QR로 보여주는 표현 영역입니다. 라이브러리 추가 여부는 별도 승인 후 판단합니다.",
    status: "locked",
    statusLabel: "후순위",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FIELDS: SystemCustomerInviteField[] = [
  {
    id: "company",
    label: "고객사",
    value: "샘플 고객사",
    description: "system_to_company_admin 초대에는 company_id가 반드시 필요합니다.",
  },
  {
    id: "role",
    label: "초대 역할",
    value: "고객관리자",
    description: "시스템관리자 초대는 1차에서 고객관리자 역할만 허용합니다.",
  },
  {
    id: "expires",
    label: "만료 정책",
    value: "7일",
    description: "초대 링크는 기본 7일 만료 정책을 사용합니다.",
  },
  {
    id: "token",
    label: "토큰 저장",
    value: "hash only",
    description: "raw token은 DB에 저장하지 않고 생성 응답에서 한 번만 표시합니다.",
  },
];

export const SYSTEM_CUSTOMER_INVITE_POLICY_NOTES = [
  "이메일 발송은 아직 연결하지 않습니다.",
  "초대 링크 생성 API 연결 전까지는 버튼을 비활성 skeleton으로 유지합니다.",
  "시스템관리자는 고객사 내부 company_users에 넣지 않습니다.",
  "QR은 초대 링크를 시각화하는 방식이며 별도 초대 정책이 아닙니다.",
] as const;
