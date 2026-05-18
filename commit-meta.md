Version :
0.13.75

Summary :
고객사 승인 오류와 거절 재입력 요청 액션 보강

Description :
시스템관리자 고객사 관리 목록에서 거절된 고객사를 재입력 요청 상태로 되돌리는 액션과 API를 추가했다. 고객사 승인 시 company_admin 역할 템플릿이 users.role 제약과 충돌하지 않도록 사용자 역할 저장값을 admin으로 정규화하고, 기존 Google 사용자도 승인 대상 회사로 재연결되도록 보정했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/system/companies/join-requests/[requestId]/reopen/route.ts

삭제 파일 목록 :
없음
