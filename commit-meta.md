Version :
0.10.85

Summary :
시스템관리자 고객사 가입 신청 승인과 회사 생성 연결

Description :
시스템관리자 고객사 가입 신청 승인 API를 추가하고, 승인 시 companies, users, company_members, member_permissions, join_requests, invitations, 고객사 초기 기준정보 복사를 하나의 트랜잭션 흐름으로 처리하도록 연결했다. /system/companies 화면의 승인 버튼도 실제 API 호출로 연결했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/system/systemCompanyApprovalConsole.ts
- lib/constants/app.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/system/standards/companyStandardsInitializationRepository.ts
- lib/system/audit/writeActions.ts

추가 파일 목록 :
- app/api/system/companies/join-requests/[requestId]/approve/route.ts

삭제 파일 목록 :
없음
