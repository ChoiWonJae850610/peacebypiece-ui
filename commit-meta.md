Version :
0.10.86

Summary :
시스템관리자 고객사 가입 신청 거절 처리 연결

Description :
시스템관리자 고객사 승인 화면에서 고객사 가입 신청을 거절할 수 있도록 실제 API를 추가하고, join_requests.rejected와 invitations.cancelled 상태 갱신 및 company_invitation.rejected 감사 로그 기록을 연결했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/system/systemCompanyApprovalConsole.ts
- lib/constants/app.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/system/audit/writeActions.ts

추가 파일 목록 :
- app/api/system/companies/join-requests/[requestId]/reject/route.ts

삭제 파일 목록 :
없음
