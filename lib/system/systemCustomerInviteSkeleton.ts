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
    title: "고객사 초대 초안 작성",
    description:
      "회사명, 담당자, 연락처, 기본 요금제, 저장공간 한도를 입력하는 시스템관리자 전용 초대 초안입니다.",
    status: "ready",
    statusLabel: "화면 반영",
  },
  {
    id: "link-create",
    title: "초대 링크 생성",
    description:
      "raw token은 생성 응답에서만 보여주고 DB에는 token_hash만 저장하는 정책으로 연결합니다.",
    status: "planned",
    statusLabel: "API 예정",
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
    statusLabel: "후속 연결",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FIELDS: SystemCustomerInviteField[] = [
  {
    id: "scope",
    label: "초대 유형",
    value: "system_to_company_admin",
    description: "시스템관리자가 신규 고객사의 고객관리자 후보에게 보내는 초대입니다.",
  },
  {
    id: "role",
    label: "기본 역할",
    value: "고객관리자",
    description: "role은 표시/기본 권한 묶음이며 실제 접근 제어는 permission_code 기준입니다.",
  },
  {
    id: "expires",
    label: "만료 정책",
    value: "7일",
    description: "초대 링크는 기본 7일 만료 정책을 사용하고 만료 후 재생성합니다.",
  },
  {
    id: "token",
    label: "토큰 저장",
    value: "hash only",
    description: "raw token은 DB에 저장하지 않고 token_hash만 저장합니다.",
  },
];

export const SYSTEM_CUSTOMER_INVITE_FORM_FIELDS: SystemCustomerInviteFormField[] = [
  {
    id: "company-name",
    label: "고객사명",
    value: "샘플 고객사",
    helper: "승인 시 companies.name 후보로 사용합니다.",
    inputType: "text",
  },
  {
    id: "business-name",
    label: "사업자명",
    value: "샘플 고객사 사업자명",
    helper: "승인 화면에서 최종 보정할 수 있는 사업자명 후보입니다.",
    inputType: "text",
  },
  {
    id: "admin-name",
    label: "담당자명",
    value: "고객사 담당자",
    helper: "가입 신청자 표시명과 대조할 기준값입니다.",
    inputType: "text",
  },
  {
    id: "admin-email",
    label: "담당자 이메일",
    value: "customer-admin@example.com",
    helper: "Google 로그인 이메일과 대조할 초대 이메일 후보입니다.",
    inputType: "email",
  },
  {
    id: "plan-code",
    label: "기본 요금제",
    value: "starter",
    helper: "승인 시 companies.plan_code 후보로 연결합니다.",
    inputType: "select",
  },
  {
    id: "storage-limit",
    label: "저장공간 한도",
    value: "5GB",
    helper: "승인 시 companies.storage_limit_bytes 후보로 연결합니다.",
    inputType: "select",
  },
];

export const SYSTEM_CUSTOMER_INVITE_RESULT_ACTIONS: SystemCustomerInviteResultAction[] = [
  {
    id: "create-invite",
    label: "초대 링크 생성",
    helper: "현재는 UI 자리만 고정하고 실제 DB 저장은 후속 API에서 연결합니다.",
    state: "disabled",
  },
  {
    id: "copy-link",
    label: "링크 복사",
    helper: "생성된 inviteUrl을 클립보드에 복사할 버튼 자리입니다.",
    state: "disabled",
  },
  {
    id: "open-preview",
    label: "가입 신청 화면 미리보기",
    helper: "/invite/company/[token] 고객사 가입 신청 화면을 미리 봅니다.",
    state: "ready",
    href: "/invite/company/preview-system-company-token",
  },
];

export const SYSTEM_CUSTOMER_INVITE_APPROVAL_RULES: SystemCustomerInviteApprovalRule[] = [
  {
    id: "no-company-before-approval",
    title: "승인 전 회사 미생성",
    description:
      "초대 링크 접속과 가입 신청만으로 companies를 생성하지 않습니다. 시스템관리자가 승인할 때 고객사를 생성합니다.",
  },
  {
    id: "company-admin-permissions",
    title: "고객관리자 권한 직접 부여",
    description:
      "승인 시 company_members와 member_permissions를 함께 확정하며 role enum 단독 제어를 사용하지 않습니다.",
  },
  {
    id: "standards-initialization",
    title: "초기 기준정보 복사 연결",
    description:
      "고객사 생성이 확정되면 시스템 기준정보를 고객사 초기 기준정보로 복사하는 0.10.51 설계와 연결합니다.",
  },
];

export const SYSTEM_CUSTOMER_INVITE_POLICY_NOTES = [
  "이메일/SMS/카카오 자동 발송은 연결하지 않습니다.",
  "초대 링크와 QR을 생성해 시스템관리자가 카톡, 문자, 이메일로 직접 전달하는 방식을 우선 사용합니다.",
  "시스템관리자는 고객사 내부 멤버로 자동 등록되지 않습니다.",
  "초대 token 원문은 저장하지 않고 token_hash만 저장합니다.",
  "초대 수락 후에도 시스템관리자 승인 전에는 고객사와 고객관리자 멤버십을 생성하지 않습니다.",
] as const;
