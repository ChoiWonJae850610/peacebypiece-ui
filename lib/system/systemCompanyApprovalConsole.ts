export type SystemCompanyApprovalStepStatus = "ready" | "planned" | "locked";

export interface SystemCompanyApprovalSummaryItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface SystemCompanyApprovalRequestField {
  id: string;
  label: string;
  value: string;
  helper: string;
  inputType: "text" | "email" | "select";
}

export interface SystemCompanyApprovalStep {
  id: string;
  title: string;
  description: string;
  status: SystemCompanyApprovalStepStatus;
  statusLabel: string;
}

export interface SystemCompanyApprovalAction {
  id: string;
  label: string;
  helper: string;
  requiredPermission: string;
  state: "disabled" | "ready";
}

export interface SystemCompanyApprovalPolicyNote {
  id: string;
  title: string;
  description: string;
}

export interface SystemCompanyApprovalPermissionItem {
  id: string;
  label: string;
  permissionCode: string;
  enabled: boolean;
}

export const SYSTEM_COMPANY_APPROVAL_SUMMARY_ITEMS: SystemCompanyApprovalSummaryItem[] = [
  {
    id: "request-type",
    label: "신청 유형",
    value: "company",
    description: "시스템관리자 고객사 초대 링크에서 들어온 고객사 생성 신청입니다.",
  },
  {
    id: "review-status",
    label: "현재 상태",
    value: "승인 대기",
    description: "join_requests.pending 상태를 시스템관리자가 검토하는 화면입니다.",
  },
  {
    id: "create-policy",
    label: "회사 생성",
    value: "승인 버튼 기준",
    description: "가입 신청만으로 companies를 만들지 않고 승인 시점에 생성합니다.",
  },
  {
    id: "admin-permission",
    label: "초기 권한",
    value: "permission_code 직접 부여",
    description: "role은 기본 묶음이며 실제 저장은 member_permissions 기준입니다.",
  },
];

export const SYSTEM_COMPANY_APPROVAL_REQUEST_FIELDS: SystemCompanyApprovalRequestField[] = [
  {
    id: "requestedCompanyName",
    label: "신청 회사명",
    value: "피스바이피스 샘플 고객사",
    helper: "join_requests.requested_company_name 후보입니다. 승인 시 companies.name으로 최종 보정합니다.",
    inputType: "text",
  },
  {
    id: "businessName",
    label: "사업자명",
    value: "샘플 사업자명",
    helper: "companies.business_name 후보입니다. 중복 회사 검토 후 확정합니다.",
    inputType: "text",
  },
  {
    id: "applicantName",
    label: "신청자 이름",
    value: "고객사 담당자",
    helper: "승인 시 고객관리자 company_member 후보로 사용합니다.",
    inputType: "text",
  },
  {
    id: "applicantEmail",
    label: "로그인 이메일",
    value: "customer-admin@example.com",
    helper: "초대 이메일과 Google OAuth 이메일 일치 여부를 검증할 기준입니다.",
    inputType: "email",
  },
  {
    id: "planCode",
    label: "요금제",
    value: "starter",
    helper: "companies.plan_code에 저장할 시스템관리자 확정값입니다.",
    inputType: "select",
  },
  {
    id: "storageLimit",
    label: "저장공간 한도",
    value: "5GB",
    helper: "companies.storage_limit_bytes로 변환해 저장할 승인값입니다.",
    inputType: "select",
  },
];

export const SYSTEM_COMPANY_APPROVAL_STEPS: SystemCompanyApprovalStep[] = [
  {
    id: "review-request",
    title: "가입 신청 검토",
    description: "join_requests.pending 신청의 초대 유형, 신청자, 회사명, 연락처, 메모를 확인합니다.",
    status: "ready",
    statusLabel: "화면 반영",
  },
  {
    id: "create-company",
    title: "고객사 생성",
    description: "회사명, 사업자명, 요금제, 저장공간 한도를 확정해 companies를 생성합니다.",
    status: "planned",
    statusLabel: "API 연결 예정",
  },
  {
    id: "approve-admin",
    title: "고객관리자 승인",
    description: "신청자를 company_members.approved 상태로 연결하고 고객관리자 기본 권한을 저장합니다.",
    status: "planned",
    statusLabel: "API 연결 예정",
  },
  {
    id: "initialize-standards",
    title: "초기 기준정보 복사",
    description: "고객사 생성 후 시스템 기준정보를 고객사 초기 생산품 유형, 단위, 외주공정 기준으로 복사합니다.",
    status: "locked",
    statusLabel: "0.10.65 연결",
  },
];

export const SYSTEM_COMPANY_APPROVAL_PERMISSION_ITEMS: SystemCompanyApprovalPermissionItem[] = [
  { id: "workorder-read", label: "작업지시서 조회", permissionCode: "workorder.read", enabled: true },
  { id: "workorder-manage", label: "작업지시서 생성·수정", permissionCode: "workorder.update", enabled: true },
  { id: "partner-manage", label: "협력업체 관리", permissionCode: "partner.manage", enabled: true },
  { id: "storage-manage", label: "저장소 조회·삭제 요청", permissionCode: "storage.delete.request", enabled: true },
  { id: "stats-read", label: "통계 조회", permissionCode: "stats.read", enabled: true },
  { id: "settings-manage", label: "환경설정 관리", permissionCode: "settings.manage", enabled: true },
  { id: "member-manage", label: "멤버 초대·승인·권한 변경", permissionCode: "member.permission.update", enabled: true },
  { id: "audit-read-company", label: "고객사 감사 로그 조회", permissionCode: "audit.read.company", enabled: true },
];

export const SYSTEM_COMPANY_APPROVAL_ACTIONS: SystemCompanyApprovalAction[] = [
  {
    id: "approve-create-company",
    label: "고객사 생성 및 승인",
    helper: "companies, company_members, member_permissions, join_requests, invitations를 하나의 승인 흐름으로 처리할 버튼 자리입니다.",
    requiredPermission: "system.company.approve",
    state: "disabled",
  },
  {
    id: "reject-request",
    label: "가입 신청 거절",
    helper: "join_requests.rejected와 invitations 상태 정리, 거절 감사 로그를 남길 버튼 자리입니다.",
    requiredPermission: "system.company.reject",
    state: "disabled",
  },
  {
    id: "open-invite",
    label: "고객사 초대 화면으로 이동",
    helper: "새 초대 링크와 QR을 다시 만들 때 사용하는 연결입니다.",
    requiredPermission: "system.invitation.create",
    state: "ready",
  },
];

export const SYSTEM_COMPANY_APPROVAL_POLICY_NOTES: SystemCompanyApprovalPolicyNote[] = [
  {
    id: "single-transaction",
    title: "승인 흐름은 트랜잭션 기준",
    description: "고객사 생성, 고객관리자 멤버십 생성, 권한 저장, 신청 승인 처리는 중간 실패 시 어색한 반쪽 데이터가 남지 않도록 하나의 트랜잭션으로 묶습니다.",
  },
  {
    id: "permission-code-first",
    title: "permission_code 우선",
    description: "role_code는 기본 체크값과 표시용으로만 사용하고 실제 접근 제어는 member_permissions.permission_code 기준으로 처리합니다.",
  },
  {
    id: "standards-after-company",
    title: "기준정보 복사는 회사 생성 후",
    description: "고객사 id가 확정된 뒤 0.10.51의 초기 기준정보 복사 설계를 연결합니다. 실패 시 회사 생성 rollback 여부를 명시합니다.",
  },
  {
    id: "audit-log-candidates",
    title: "감사 로그 후보",
    description: "company.created, company_invitation.approved, member.approved, member.permission_updated, company.standards_initialized 이벤트를 후속 연결합니다.",
  },
];
