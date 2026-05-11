export type MemberInvitationJoinRequestStatus = "ready" | "planned" | "locked";

export interface MemberInvitationJoinRequestStep {
  id: string;
  title: string;
  description: string;
  status: MemberInvitationJoinRequestStatus;
  statusLabel: string;
}

export interface MemberInvitationJoinRequestField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  helper: string;
}

export interface MemberInvitationJoinRequestPolicyNote {
  id: string;
  title: string;
  description: string;
}

export interface MemberInvitationTokenPreview {
  rawToken: string;
  maskedToken: string;
  stateLabel: string;
  description: string;
}

export const MEMBER_INVITATION_JOIN_REQUEST_TITLE = "멤버 가입 신청";

export const MEMBER_INVITATION_JOIN_REQUEST_DESCRIPTION =
  "고객관리자가 공유한 초대 링크로 접속한 사용자가 로그인 후 가입 신청을 남기는 화면입니다.";

export const MEMBER_INVITATION_JOIN_REQUEST_STEPS: MemberInvitationJoinRequestStep[] = [
  {
    id: "token-check",
    title: "초대 링크 확인",
    description:
      "URL token을 서버에서 token_hash로 변환해 invitations.active 상태와 만료일을 확인합니다.",
    status: "ready",
    statusLabel: "화면 고정",
  },
  {
    id: "oauth-login",
    title: "Google 로그인",
    description:
      "로그인 전 사용자는 Google 로그인 안내를 보고, 로그인 후 신청 폼을 작성합니다.",
    status: "planned",
    statusLabel: "후속 연결",
  },
  {
    id: "join-request",
    title: "가입 신청 저장",
    description:
      "join_requests에 신청 정보를 저장하고 승인 대기 대시보드로 이동합니다.",
    status: "planned",
    statusLabel: "후속 연결",
  },
  {
    id: "admin-approval",
    title: "고객관리자 승인",
    description:
      "고객관리자가 /admin/members에서 신청자를 승인하고 permission_code를 직접 부여합니다.",
    status: "locked",
    statusLabel: "승인 필요",
  },
];

export const MEMBER_INVITATION_JOIN_REQUEST_FIELDS: MemberInvitationJoinRequestField[] = [
  {
    id: "applicantName",
    label: "신청자 이름",
    placeholder: "예: 김디자이너",
    required: true,
    helper: "고객관리자가 승인 대기 목록에서 확인할 이름입니다.",
  },
  {
    id: "applicantPhone",
    label: "연락처",
    placeholder: "선택 입력",
    required: false,
    helper: "자동 SMS 발송은 하지 않으며, 승인 검토용 보조 정보로만 사용합니다.",
  },
  {
    id: "requestMemo",
    label: "신청 메모",
    placeholder: "담당 업무나 요청 권한을 간단히 입력",
    required: false,
    helper: "권한은 최종적으로 고객관리자가 permission_code 기준으로 확정합니다.",
  },
];

export const MEMBER_INVITATION_JOIN_REQUEST_POLICY_NOTES: MemberInvitationJoinRequestPolicyNote[] = [
  {
    id: "pending-access",
    title: "승인 전 접근 제한",
    description:
      "가입 신청 후 승인 전 사용자는 승인 대기 대시보드, 개인 설정, 로그아웃만 접근할 수 있습니다.",
  },
  {
    id: "permission-code",
    title: "permission_code 직접 부여",
    description:
      "role은 기본 권한 묶음일 뿐이며 실제 메뉴 노출과 API 검증은 member_permissions.permission_code 기준입니다.",
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

  return "초대 링크 확인 대기";
}

function readTokenDescription(token: string): string {
  if (!token) {
    return "URL에 초대 token이 없어 가입 신청을 진행할 수 없습니다.";
  }

  if (token.startsWith("preview-")) {
    return "관리자 초대 생성 화면에서 사용하는 미리보기 token입니다. 실제 저장은 후속 API 연결에서 처리합니다.";
  }

  return "후속 버전에서 token_hash 조회, 초대 만료 검증, 로그인 사용자 이메일 검증을 연결합니다.";
}

export function createMemberInvitationTokenPreview(token: string): MemberInvitationTokenPreview {
  const normalizedToken = normalizeToken(token);

  return {
    rawToken: normalizedToken,
    maskedToken: maskToken(normalizedToken),
    stateLabel: readTokenStateLabel(normalizedToken),
    description: readTokenDescription(normalizedToken),
  };
}
