Version : 0.9.81
Base Version : 0.9.80
Target Version : 0.9.81
Summary : 초대 UI와 invitation API 연결
Description : 시스템관리자 고객 초대 화면과 고객관리자 멤버 초대 화면에서 POST /api/invitations를 호출해 초대 링크를 생성하고, 생성된 inviteUrl을 화면과 QR preview 영역에 표시하도록 연결했습니다. 이메일 발송, DB 저장, 초대 수락 페이지는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/invitations/InvitationQrPreview.tsx
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- components/admin/invitations/CompanyMemberInviteSkeleton.tsx
추가 파일 목록 :
- lib/invitations/invitationClient.ts
- docs/invitations/invitation_ui_api_connection.md
삭제 파일 목록 :
- 없음
