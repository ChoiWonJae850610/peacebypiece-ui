Version :
0.10.79

Summary :
초대 token 검증과 가입 신청 저장 연결

Description :
초대 링크 raw token을 서버에서 token_hash로 검증하고, 멤버 및 고객사 가입 신청을 join_requests.pending으로 저장하는 API와 화면 제출 흐름을 연결했다. OAuth 연결 전 테스트를 위해 join_requests.user_id를 nullable로 보정하고 applicant_email 기준 중복 신청 방지 인덱스를 full_reset에 반영했다.

수정 파일 목록 :
- components/invitations/MemberInvitationJoinRequestPage.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/invitations/memberInvitationJoinRequestPresentation.ts
- lib/invitations/companyInvitationJoinRequestPresentation.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/invitationPolicy.ts
- lib/invitations/index.ts
- lib/system/audit/writeActions.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
- app/api/invitations/verify/route.ts
- app/api/invitations/join-requests/route.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestTypes.ts
- lib/invitations/joinRequestRepository.ts
- docs/invitation-token-verify-join-request-0.10.79.md

삭제 파일 목록 :
없음
