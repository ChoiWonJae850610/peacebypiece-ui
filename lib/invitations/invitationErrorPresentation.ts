const INVITATION_ERROR_MESSAGES = {
  notFound: {
    company: "유효하지 않은 고객사 초대 링크예요.",
    member: "유효하지 않은 초대 링크예요.",
  },
  expired: {
    company: "고객사 초대가 만료되었어요.",
    member: "초대가 만료되었어요.",
  },
  notActive: {
    company: "현재 사용할 수 없는 고객사 초대예요.",
    member: "현재 사용할 수 없는 초대예요.",
  },
  alreadyClaimed: {
    company: "이미 사용된 고객사 초대 링크예요.",
    member: "이미 사용된 초대 링크예요.",
  },
  scopeMismatch: {
    company: "초대 링크의 사용 범위가 맞지 않아요.",
    member: "초대 링크의 사용 범위가 맞지 않아요.",
  },
  fallback: {
    company: "고객사 초대 링크를 확인할 수 없어요.",
    member: "초대 링크를 확인할 수 없어요.",
  },
} as const;

const INVITATION_AUTH_ERROR_MESSAGES: Record<string, string> = {
  GOOGLE_OAUTH_CLIENT_ID_REQUIRED: "Google 로그인 설정이 아직 연결되지 않았습니다.",
  GOOGLE_OAUTH_CLIENT_SECRET_REQUIRED: "Google 로그인 보안 설정이 아직 연결되지 않았습니다.",
  INVITATION_TOKEN_REQUIRED: "초대 토큰이 없는 링크입니다.",
};

function normalizeErrorCode(errorCode: string | null | undefined): string {
  return String(errorCode ?? "").trim().toUpperCase();
}

export function resolveCompanyInvitationErrorMessage(errorCode: string | null | undefined): string {
  const normalized = normalizeErrorCode(errorCode);
  if (normalized === "INVITATION_NOT_FOUND") return INVITATION_ERROR_MESSAGES.notFound.company;
  if (normalized === "INVITATION_EXPIRED") return INVITATION_ERROR_MESSAGES.expired.company;
  if (normalized === "INVITATION_NOT_ACTIVE") return INVITATION_ERROR_MESSAGES.notActive.company;
  if (normalized === "INVITATION_ALREADY_CLAIMED") return INVITATION_ERROR_MESSAGES.alreadyClaimed.company;
  if (normalized === "INVITATION_SCOPE_MISMATCH") return INVITATION_ERROR_MESSAGES.scopeMismatch.company;
  return INVITATION_ERROR_MESSAGES.fallback.company;
}

export function resolveCompanyInvitationAlreadyUsedMessage(): string {
  return INVITATION_ERROR_MESSAGES.alreadyClaimed.company;
}

export function resolveMemberInvitationErrorMessage(errorCode: string | null | undefined): string {
  const normalized = normalizeErrorCode(errorCode);
  if (normalized === "INVITATION_NOT_FOUND") return INVITATION_ERROR_MESSAGES.notFound.member;
  if (normalized === "INVITATION_EXPIRED") return INVITATION_ERROR_MESSAGES.expired.member;
  if (normalized === "INVITATION_NOT_ACTIVE") return INVITATION_ERROR_MESSAGES.notActive.member;
  if (normalized === "INVITATION_ALREADY_CLAIMED") return INVITATION_ERROR_MESSAGES.alreadyClaimed.member;
  if (normalized === "INVITATION_SCOPE_MISMATCH") return INVITATION_ERROR_MESSAGES.scopeMismatch.member;
  return INVITATION_ERROR_MESSAGES.fallback.member;
}

export function resolveInviteAuthErrorMessage(errorCode: string | null | undefined): string {
  const normalized = normalizeErrorCode(errorCode);
  return INVITATION_AUTH_ERROR_MESSAGES[normalized] ?? "초대 링크 처리 중 문제가 발생했습니다.";
}
