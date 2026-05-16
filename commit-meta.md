Version : 0.13.16
Summary : Google OAuth 기반 초대 가입 신청과 Seolo Seoul 테스트 DB 기준 추가
Description : 초대 링크에서 Google 이름과 이메일로 가입 신청을 생성하는 OAuth 시작/콜백 route를 추가하고, users/join_requests에 Google 식별자·프로필·연락처·생일 준비 필드를 반영했습니다. Seolo Seoul 고객사와 관리자 seed SQL을 추가하고, 초대 생성 기본 고객사/관리자 기준을 WAFL 테스트 기준으로 정리했습니다. 실제 Google phone scope, SMS/email 발송, 관리자 세션 인증은 포함하지 않았습니다.
수정 파일 목록 :
- .env.example
- components/admin/members/AdminMemberManagementDashboard.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- db/schema/full_reset.sql
- lib/admin/members/memberManagementPresentation.ts
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberTypes.ts
- lib/constants/app.ts
- lib/constants/company.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
추가 파일 목록 :
- app/api/auth/google/callback/route.ts
- app/api/auth/google/start/route.ts
- app/invite/error/page.tsx
- db/schema/patch_0_13_16_google_oauth_member_join.sql
- db/seed/seolo_seoul_admin_seed.sql
- lib/auth/googleOAuth.ts
삭제 파일 목록 :
- 없음
