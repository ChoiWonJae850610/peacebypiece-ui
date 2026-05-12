export type CompanyInvitationJoinRequestStatus = "ready" | "planned" | "locked";

export interface CompanyInvitationJoinRequestStep {
  id: string;
  title: string;
  description: string;
  status: CompanyInvitationJoinRequestStatus;
  statusLabel: string;
}

export interface CompanyInvitationJoinRequestField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  helper: string;
}

export interface CompanyInvitationJoinRequestPolicyNote {
  id: string;
  title: string;
  description: string;
}

export interface CompanyInvitationTokenPreview {
  rawToken: string;
  maskedToken: string;
  stateLabel: string;
  description: string;
}

export interface CompanyInvitationSummaryItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

export const COMPANY_INVITATION_JOIN_REQUEST_TITLE = "고객사 가입 신청";

export const COMPANY_INVITATION_JOIN_REQUEST_DESCRIPTION =
  "시스템관리자가 공유한 고객사 초대 링크로 접속한 담당자가 로그인 후 고객사 가입 신청을 남기는 화면입니다.";

export const COMPANY_INVITATION_SUMMARY_ITEMS: CompanyInvitationSummaryItem[] = [
  {
    id: "scope",
    label: "초대 유형",
    value: "system_to_company_admin",
    description: "시스템관리자가 신규 고객사 담당자에게 보내는 고객사 생성 후보 초대입니다.",
  },
  {
    id: "approval",
    label: "승인 기준",
    value: "시스템관리자 승인",
    description: "가입 신청만으로 고객사가 생성되지 않고 시스템관리자 승인 시점에 확정됩니다.",
  },
  {
    id: "role",
    label: "초기 권한",
    value: "고객관리자 후보",
    description: "role은 표시용이며 실제 접근 제어는 승인 시 부여되는 permission_code 기준입니다.",
  },
  {
    id: "standards",
    label: "초기 기준정보",
    value: "승인 후 복사",
    description: "고객사 생성이 확정되면 시스템 기준정보 초기 복사 흐름과 연결합니다.",
  },
];

export const COMPANY_INVITATION_JOIN_REQUEST_STEPS: CompanyInvitationJoinRequestStep[] = [
  {
    id: "token-check",
    title: "고객사 초대 확인",
    description:
      "URL token을 서버에서 token_hash로 변환해 invitations 상태, 초대 유형, 만료일을 확인합니다.",
    status: "ready",
    statusLabel: "DB 검증 연결",
  },
  {
    id: "oauth-login",
    title: "Google 로그인",
    description:
      "신청자는 Google 로그인 후 초대 이메일과 로그인 이메일이 일치하는지 검증받습니다.",
    status: "planned",
    statusLabel: "후속 연결",
  },
  {
    id: "join-request",
    title: "고객사 신청 저장",
    description:
      "join_requests에 request_type=company 기준으로 회사명, 담당자, 연락처, 비고를 저장합니다.",
    status: "ready",
    statusLabel: "저장 연결",
  },
  {
    id: "system-approval",
    title: "시스템관리자 승인",
    description:
      "시스템관리자가 회사명, 요금제, 저장공간, 고객관리자 권한을 확정한 뒤 고객사를 생성합니다.",
    status: "locked",
    statusLabel: "승인 필요",
  },
];

export const COMPANY_INVITATION_JOIN_REQUEST_FIELDS: CompanyInvitationJoinRequestField[] = [
  {
    id: "applicantName",
    label: "신청자 이름",
    placeholder: "예: 김대표",
    required: true,
    helper: "시스템관리자가 승인 대기 목록에서 확인할 담당자 이름입니다.",
  },
  {
    id: "applicantPhone",
    label: "연락처",
    placeholder: "선택 입력",
    required: false,
    helper: "자동 SMS 발송은 하지 않으며 승인 검토용 보조 정보로만 사용합니다.",
  },
  {
    id: "requestedCompanyName",
    label: "신청 회사명",
    placeholder: "예: 피스바이피스 샘플실",
    required: true,
    helper: "승인 시 companies.name 후보이며 시스템관리자가 최종 보정할 수 있습니다.",
  },
  {
    id: "businessName",
    label: "사업자명",
    placeholder: "사업자명 또는 상호명",
    required: false,
    helper: "승인 화면에서 companies.business_name 후보로 사용할 수 있습니다.",
  },
  {
    id: "requestMemo",
    label: "신청 메모",
    placeholder: "업종, 담당 업무, 요청사항 등을 입력",
    required: false,
    helper: "요금제와 저장공간은 시스템관리자가 승인 시 최종 확정합니다.",
  },
  {
    id: "expectedAdminEmail",
    label: "로그인 이메일",
    placeholder: "Google 로그인 이메일로 자동 확인 예정",
    required: true,
    helper: "초대 이메일과 Google 로그인 이메일 일치 여부 검증에 사용합니다.",
  },
];

export const COMPANY_INVITATION_JOIN_REQUEST_POLICY_NOTES: CompanyInvitationJoinRequestPolicyNote[] = [
  {
    id: "no-company-before-approval",
    title: "승인 전 회사 미생성",
    description:
      "초대 링크 접속과 가입 신청만으로 companies, company_members, member_permissions를 생성하지 않습니다.",
  },
  {
    id: "system-admin-review",
    title: "시스템관리자 최종 검토",
    description:
      "회사명 중복, 요금제, 저장공간, 고객관리자 권한은 시스템관리자가 승인 화면에서 확정합니다.",
  },
  {
    id: "token-storage",
    title: "token 원문 저장 금지",
    description:
      "초대 token 원문은 URL로 한 번 전달하고 DB에는 token_hash만 저장합니다.",
  },
];

function normalizeToken(token: string): string {
  return decodeURIComponent(token).trim();
}

function maskToken(token: string): string {
  if (!token) {
    return "초대 token 없음";
  }

  if (token.length <= 12) {
    return `${token.slice(0, 3)}•••${token.slice(-3)}`;
  }

  return `${token.slice(0, 6)}••••••${token.slice(-6)}`;
}

function readTokenStateLabel(token: string): string {
  if (!token) {
    return "유효하지 않은 링크";
  }

  if (token.startsWith("preview-")) {
    return "미리보기 링크";
  }

  return "고객사 초대 확인 대기";
}

function readTokenDescription(token: string): string {
  if (!token) {
    return "URL에 고객사 초대 token이 없어 가입 신청을 진행할 수 없습니다.";
  }

  if (token.startsWith("preview-")) {
    return "시스템관리자 고객사 초대 화면에서 사용하는 미리보기 token입니다. 실제 DB 조회 없이 화면 동작을 확인합니다.";
  }

  return "서버에서 token_hash 조회와 초대 만료 검증을 수행한 뒤 고객사 가입 신청을 저장합니다.";
}

export function createCompanyInvitationTokenPreview(
  token: string,
): CompanyInvitationTokenPreview {
  const normalizedToken = normalizeToken(token);

  return {
    rawToken: normalizedToken,
    maskedToken: maskToken(normalizedToken),
    stateLabel: readTokenStateLabel(normalizedToken),
    description: readTokenDescription(normalizedToken),
  };
}
