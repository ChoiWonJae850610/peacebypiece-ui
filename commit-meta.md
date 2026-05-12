Version :
0.10.82

Summary :
고객관리자 멤버 가입 신청 승인/거절 API 연결

Description :
고객관리자 멤버관리 화면에서 pending 멤버 가입 신청을 승인하거나 거절할 수 있도록 승인/거절 API를 추가했다. 승인 시 users 보정 생성, company_members approved 생성, member_permissions 저장, join_requests approved 처리, invitations accepted 처리를 하나의 DB transaction으로 묶었다. 거절 시 join_requests rejected 처리와 invitations cancelled 처리를 연결하고 member.approved/member.rejected 감사 로그를 남기도록 보강했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts

추가 파일 목록 :
- app/api/invitations/join-requests/[requestId]/approve/route.ts
- app/api/invitations/join-requests/[requestId]/reject/route.ts

삭제 파일 목록 :
없음
