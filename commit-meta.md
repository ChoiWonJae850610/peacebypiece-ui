Version :
0.10.80

Summary :
승인 대기 가입 신청 상태 조회 연결

Description :
초대 링크에서 가입 신청 저장 후 승인 대기 화면으로 이동할 수 있도록 redirectPath에 requestId를 포함하고, /pending 화면에서 실제 join_requests.pending 상태를 조회하도록 연결했다. 가입 신청 조회 API의 GET 동작도 추가했다.

수정 파일 목록 :
- components/invitations/MemberInvitationJoinRequestPage.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/invitations/PendingApprovalDashboard.tsx
- app/pending/page.tsx
- app/api/invitations/join-requests/route.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/invitations/pendingApprovalDashboardPresentation.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/pending-join-request-actual-connection-0.10.80.md

삭제 파일 목록 :
없음
