export type CompanyMemberInviteRole =
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer";

export type CompanyMemberInvitePreset =
  | "designer"
  | "inspector"
  | "inventory_manager"
  | "viewer"
  | "custom";

export interface CompanyMemberInviteRoleOption {
  role: CompanyMemberInviteRole;
  label: string;
  preset: CompanyMemberInvitePreset;
  description: string;
  permissions: string[];
}

export interface CompanyMemberInvitePolicyNote {
  title: string;
  description: string;
}

export const COMPANY_MEMBER_INVITE_ROLE_OPTIONS: CompanyMemberInviteRoleOption[] = [
  {
    role: "designer",
    label: "디자이너",
    preset: "designer",
    description: "작업지시서 작성, 검토요청 중심 역할입니다.",
    permissions: ["workorder.create", "workorder.edit", "workorder.request_review"],
  },
  {
    role: "inspector",
    label: "검수담당자",
    preset: "inspector",
    description: "생산/검수 확인 중심 역할입니다.",
    permissions: ["workorder.inspect", "workorder.complete"],
  },
  {
    role: "inventory_manager",
    label: "재고담당자",
    preset: "inventory_manager",
    description: "재고 관리 중심 역할입니다.",
    permissions: ["inventory.manage"],
  },
  {
    role: "viewer",
    label: "조회자",
    preset: "viewer",
    description: "조회와 통계 확인 중심의 제한 역할입니다.",
    permissions: ["stats.view"],
  },
];

export const COMPANY_MEMBER_INVITE_POLICY_NOTES: CompanyMemberInvitePolicyNote[] = [
  {
    title: "company_id 고정",
    description: "고객관리자 초대는 자기 고객사 company_id로만 생성됩니다.",
  },
  {
    title: "역할 제한",
    description: "고객관리자는 디자이너, 검수담당자, 재고담당자, 조회자만 초대합니다.",
  },
  {
    title: "관리자 초대 제외",
    description: "고객관리자 추가 초대는 별도 운영 정책으로 분리합니다.",
  },
  {
    title: "링크 우선",
    description: "이메일 발송 전 초대 링크 생성과 복사 흐름을 먼저 연결합니다.",
  },
];

export const COMPANY_MEMBER_INVITE_FORM_FIELDS = [
  {
    id: "company",
    label: "초대 고객사",
    value: "현재 고객관리자의 고객사",
  },
  {
    id: "email",
    label: "초대 이메일",
    value: "member@example.com",
  },
  {
    id: "expires",
    label: "만료",
    value: "7일",
  },
] as const;
