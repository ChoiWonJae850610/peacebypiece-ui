Version : 0.9.102
Base Version : 0.9.101
Target Version : 0.9.102
Summary : 멤버 초대 UI 본 화면 재연결
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin/invites를 CompanyMemberInviteSkeleton 본 화면으로 재연결했습니다. 기존 createInvitationLink()와 POST /api/invitations를 사용해 초대 링크를 생성하고 inviteUrl과 QR preview를 표시합니다. 이메일 발송, 인증/회원가입, 초대 수락 후 user 생성, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/invites/page.tsx
- lib/admin/adminRegressionRoutes.ts
추가 파일 목록 :
- docs/admin/admin_member_invite_ui_reconnect.md
삭제 파일 목록 :
- 없음
