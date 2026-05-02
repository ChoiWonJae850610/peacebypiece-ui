Version : 0.9.104
Base Version : 0.9.103
Target Version : 0.9.104
Summary : 시스템 고객 초대 UI 본 화면 재연결
Description : 0.9.94에서 회귀 점검 화면으로 대체된 /system/invites를 SystemCustomerInviteSkeleton 본 화면으로 재연결했습니다. 기존 createInvitationLink()와 POST /api/invitations를 사용해 system_to_company_admin scope의 고객관리자 초대 링크를 생성하고 inviteUrl과 QR preview를 표시합니다. 이메일 발송, 고객사 생성 자동화, 인증/회원가입, 초대 수락 후 user 생성, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/system/invites/page.tsx
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- lib/system/systemCustomerInviteSkeleton.ts
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- docs/system/system_customer_invite_ui_reconnect.md
삭제 파일 목록 :
- 없음
