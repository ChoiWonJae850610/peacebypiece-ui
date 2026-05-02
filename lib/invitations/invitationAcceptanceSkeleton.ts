import type { InvitationAcceptanceStatus } from "./invitationAcceptanceTypes";

export interface InvitationAcceptStatusView {
  status: InvitationAcceptanceStatus;
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

export const INVITATION_ACCEPT_STATUS_VIEWS: Record<
  InvitationAcceptanceStatus,
  InvitationAcceptStatusView
> = {
  ready: {
    status: "ready",
    label: "수락 가능",
    title: "초대 링크 검증 완료",
    description: "유효한 초대 링크입니다. 초대 수락 버튼으로 상태를 accepted로 변경할 수 있습니다.",
  },
  invalid: {
    status: "invalid",
    label: "유효하지 않음",
    title: "초대 링크를 확인할 수 없음",
    description: "토큰이 비어 있거나 DB에서 invitation을 찾지 못한 경우입니다.",
  },
  expired: {
    status: "expired",
    label: "만료",
    title: "초대 링크 만료",
    description: "expires_at이 지난 pending invitation입니다.",
  },
  revoked: {
    status: "revoked",
    label: "취소",
    title: "초대 취소됨",
    description: "관리자가 초대를 취소했거나 revoked 상태가 된 경우입니다.",
  },
  accepted: {
    status: "accepted",
    label: "수락 완료",
    title: "초대 수락 완료",
    description: "초대 수락 처리가 완료된 상태입니다. 실제 회원가입/로그인 연결은 후속 단계입니다.",
  },
};

export function getInvitationAcceptStatusView(
  status: InvitationAcceptanceStatus,
): InvitationAcceptStatusView {
  return INVITATION_ACCEPT_STATUS_VIEWS[status];
}

export const INVITATION_ACCEPT_POLICY_NOTES = [
  "raw token은 URL에서만 받고 DB에는 token_hash만 저장합니다.",
  "0.9.109는 초대 상태 조회와 invitation status 업데이트까지만 연결합니다.",
  "실제 인증/회원가입/user 생성은 아직 연결하지 않습니다.",
  "accepted_user_id는 회원가입 연결 전까지 null로 처리될 수 있습니다.",
] as const;
