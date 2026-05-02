export interface InvitationQrPreviewCell {
  x: number;
  y: number;
}

export interface InvitationQrPreviewModel {
  title: string;
  description: string;
  inviteUrl: string;
  cells: InvitationQrPreviewCell[];
}

export const INVITATION_QR_PREVIEW_CELLS: InvitationQrPreviewCell[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 1 },
  { x: 2, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },

  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 6, y: 1 },
  { x: 8, y: 1 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },

  { x: 0, y: 6 },
  { x: 1, y: 6 },
  { x: 2, y: 6 },
  { x: 0, y: 7 },
  { x: 2, y: 7 },
  { x: 0, y: 8 },
  { x: 1, y: 8 },
  { x: 2, y: 8 },

  { x: 4, y: 1 },
  { x: 3, y: 3 },
  { x: 5, y: 3 },
  { x: 7, y: 4 },
  { x: 4, y: 5 },
  { x: 6, y: 6 },
  { x: 8, y: 6 },
  { x: 3, y: 7 },
  { x: 5, y: 8 },
  { x: 7, y: 8 },
];

export const SYSTEM_CUSTOMER_INVITE_QR_PREVIEW: InvitationQrPreviewModel = {
  title: "고객관리자 초대 QR",
  description:
    "초대 링크 생성 API 연결 후 raw token 기반 inviteUrl을 QR로 표시할 영역입니다.",
  inviteUrl: "https://peacebypiece.example/invite/system-admin-token-preview",
  cells: INVITATION_QR_PREVIEW_CELLS,
};

export const COMPANY_MEMBER_INVITE_QR_PREVIEW: InvitationQrPreviewModel = {
  title: "멤버 초대 QR",
  description:
    "고객관리자가 생성한 초대 링크를 QR로 보여줄 영역입니다. QR은 별도 초대 정책이 아니라 링크 표현 방식입니다.",
  inviteUrl: "https://peacebypiece.example/invite/company-member-token-preview",
  cells: INVITATION_QR_PREVIEW_CELLS,
};
