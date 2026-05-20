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

export interface SystemCustomerInviteFormField {
  id: string;
  label: string;
  value: string;
  helper: string;
  inputType: "text" | "email" | "select";
}

export interface SystemCustomerInviteResultAction {
  id: string;
  label: string;
  helper: string;
  state: "ready" | "disabled";
  href?: string;
}

export interface SystemCustomerInviteApprovalRule {
  id: string;
  title: string;
  description: string;
}

export const SYSTEM_CUSTOMER_INVITE_STEPS: SystemCustomerInviteStep[] = [
  {
    id: "customer-draft",
    title: "고객사 초대 정보 입력",
    description:
      "회사명, 담당자, 연락처, 기본 요금제, 저장공간 한도를 입력합니다.",
    status: "ready",
    statusLabel: "운영 가능",
  },
  {
    id: "link-create",
    title: "초대 링크 생성",
    description:
      "초대 링크는 한 번 생성해 전달하고, 만료 전까지 다시 복사할 수 있습니다.",
    status: "ready",
    statusLabel: "운영 가능",
  },
  {
    id: "manual-share",
    title: "링크·QR 직접 전달",
    description:
      "자동 이메일/SMS 발송 없이 링크 복사와 QR 표시를 통해 카톡, 문자, 이메일로 직접 공유합니다.",
    status: "ready",
    statusLabel: "정책 확정",
  },
  {
    id: "approval-create-company",
    title: "승인 후 고객사 생성",
    description:
      "신청자가 가입 신청을 완료하면 시스템관리자가 회사명, 요금제, 저장공간, 고객관리자 권한을 확정합니다.",
    status: "locked",
    statusLabel: "운영 예정",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FIELDS: SystemCustomerInviteField[] = [
  {
    id: "scope",
    label: "초대 유형",
    value: "고객사 관리자 초대",
    description: "시스템관리자가 신규 고객사의 고객관리자 후보에게 보내는 초대입니다.",
  },
  {
    id: "role",
    label: "기본 역할",
    value: "고객관리자",
    description: "승인 후 고객사 관리자 권한으로 업무 화면을 사용할 수 있습니다.",
  },
  {
    id: "expires",
    label: "만료 정책",
    value: "7일",
    description: "초대 링크는 기본 7일 만료 정책을 사용하고 만료 후 재생성합니다.",
  },
  {
    id: "token",
    label: "초대 보안",
    value: "보안 저장",
    description: "초대 링크 원문은 안전한 방식으로 관리합니다.",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FORM_FIELDS: SystemCustomerInviteFormField[] = [
  {
    id: "company-name",
    label: "고객사명",
    value: "신규 고객사",
    helper: "승인 요청 시 사용할 고객사명을 입력합니다.",
    inputType: "text",
  },
  {
    id: "business-name",
    label: "사업자명",
    value: "신규 고객사 사업자명",
    helper: "승인 화면에서 최종 보정할 수 있는 사업자명 후보입니다.",
    inputType: "text",
  },
  {
    id: "admin-name",
    label: "담당자명",
    value: "고객사 담당자",
    helper: "초대 대상 담당자 이름을 입력합니다.",
    inputType: "text",
  },
  {
    id: "admin-email",
    label: "담당자 이메일",
    value: "customer-admin@example.com",
    helper: "초대 안내를 전달할 이메일을 입력합니다.",
    inputType: "email",
  },
  {
    id: "plan-code",
    label: "기본 요금제",
    value: "starter",
    helper: "승인 후 적용할 기본 요금제를 선택합니다.",
    inputType: "select",
  },
  {
    id: "storage-limit",
    label: "저장공간 한도",
    value: "5GB",
    helper: "승인 후 적용할 저장공간 한도를 선택합니다.",
    inputType: "select",
  },
];

export const SYSTEM_CUSTOMER_INVITE_RESULT_ACTIONS: SystemCustomerInviteResultAction[] = [
  {
    id: "create-invite",
    label: "초대 링크 생성",
    helper: "고객사 관리자에게 전달할 초대 링크를 생성합니다.",
    state: "ready",
  },
  {
    id: "copy-link",
    label: "링크 복사",
    helper: "생성된 초대 링크를 복사합니다. 필요한 채널로 직접 전달합니다.",
    state: "disabled",
  },
  {
    id: "open-preview",
    label: "가입 신청 화면 확인",
    helper: "초대 대상자가 보게 될 가입 신청 화면을 확인합니다.",
    state: "ready",
    href: "/invite/company/preview-system-company-token",
  },
];

export const SYSTEM_CUSTOMER_INVITE_APPROVAL_RULES: SystemCustomerInviteApprovalRule[] = [
  {
    id: "no-company-before-approval",
    title: "승인 후 고객사 생성",
    description:
      "초대 대상자가 가입 신청을 완료하면 시스템관리자가 검토 후 고객사를 생성합니다.",
  },
  {
    id: "company-admin-permissions",
    title: "고객관리자 권한 부여",
    description:
      "승인 시 고객사 관리자에게 필요한 기본 권한을 함께 부여합니다.",
  },
  {
    id: "standards-initialization",
    title: "초기 기준정보 준비",
    description:
      "고객사 생성 후 업무에 필요한 기본 기준정보를 사용할 수 있게 준비합니다.",
  },
];

export const SYSTEM_CUSTOMER_INVITE_POLICY_NOTES = [
  "자동 발송 기능이 활성화되기 전까지는 링크 복사 방식으로 전달합니다.",
  "초대 링크와 QR을 생성해 시스템관리자가 카톡, 문자, 이메일로 직접 전달하는 방식을 우선 사용합니다.",
  "시스템관리자는 고객사 내부 멤버로 자동 등록되지 않습니다.",
  "초대 링크는 안전한 방식으로 관리합니다.",
  "초대 수락 후에도 시스템관리자 승인 전에는 서비스 사용을 시작하지 않습니다.",
] as const;
