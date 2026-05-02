export type InvitationAcceptStatus =
  | "ready"
  | "invalid"
  | "expired"
  | "revoked"
  | "accepted";

export interface InvitationAcceptStatusCard {
  status: InvitationAcceptStatus;
  label: string;
  title: string;
  description: string;
}

export function maskInviteToken(token: string): string {
  const normalized = token.trim();

  if (!normalized) {
    return "토큰 없음";
  }

  if (normalized.length <= 12) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-6)}`;
}

export const INVITATION_ACCEPT_STATUS_CARDS: InvitationAcceptStatusCard[] = [
  {
    status: "ready",
    label: "검증 대기",
    title: "초대 링크 검증 준비",
    description:
      "0.9.85에서 raw token을 hash로 변환한 뒤 invitation 상태를 조회합니다.",
  },
  {
    status: "invalid",
    label: "유효하지 않음",
    title: "초대 링크를 확인할 수 없음",
    description:
      "토큰이 비어 있거나 DB에서 invitation을 찾지 못한 경우 표시할 상태입니다.",
  },
  {
    status: "expired",
    label: "만료",
    title: "초대 링크 만료",
    description:
      "expires_at이 지난 pending invitation에 대해 표시할 상태입니다.",
  },
  {
    status: "revoked",
    label: "취소",
    title: "초대 취소됨",
    description:
      "관리자가 초대를 취소했거나 revoked 상태가 된 경우 표시할 상태입니다.",
  },
  {
    status: "accepted",
    label: "수락 완료",
    title: "초대 수락 완료",
    description:
      "초대 수락 처리 후 사용자가 다음 가입/로그인 단계로 이동할 때 표시할 상태입니다.",
  },
];

export const INVITATION_ACCEPT_POLICY_NOTES = [
  "raw token은 URL에서만 받고 DB에는 token_hash만 저장합니다.",
  "0.9.84는 화면 skeleton이며 실제 검증 API 호출은 하지 않습니다.",
  "0.9.85에서 초대 수락 API skeleton을 추가합니다.",
  "실제 인증/회원가입 연결은 후순위입니다.",
] as const;
