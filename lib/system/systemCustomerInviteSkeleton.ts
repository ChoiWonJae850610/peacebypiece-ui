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
    description: "기존 고객사를 선택하거나 고객사 ID를 직접 입력해 초대 링크를 생성합니다.",
    status: "ready",
    statusLabel: "연결됨",
  },
  {
    id: "admin-email",
    title: "고객관리자 이메일 입력",
    description: "고객사 관리자에게 전달할 초대 링크의 수신 이메일을 입력합니다.",
    status: "ready",
    statusLabel: "연결됨",
  },
  {
    id: "link-create",
    title: "초대 링크 생성",
    description: "POST /api/invitations를 호출해 system_to_company_admin 초대 링크를 생성합니다.",
    status: "ready",
    statusLabel: "API",
  },
  {
    id: "qr",
    title: "QR 표시",
    description: "생성된 초대 링크를 QR preview 영역에 표시합니다.",
    status: "ready",
    statusLabel: "preview",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FIELDS: SystemCustomerInviteField[] = [
  {
    id: "company",
    label: "고객사",
    value: "company-sample-customer",
    description: "system_to_company_admin 초대에는 company_id가 반드시 필요합니다.",
  },
  {
    id: "role",
    label: "초대 역할",
    value: "고객관리자",
    description: "시스템관리자 초대는 1차에서 고객관리자 역할만 허용합니다.",
  },
  {
    id: "scope",
    label: "초대 범위",
    value: "system_to_company_admin",
    description: "고객사 내부 멤버 초대와 구분되는 시스템관리자 초대 scope입니다.",
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
  "고객사 생성 자동화는 아직 연결하지 않습니다.",
  "시스템관리자는 고객사 내부 company_users에 넣지 않습니다.",
  "QR은 초대 링크를 시각화하는 방식이며 별도 초대 정책이 아닙니다.",
] as const;
