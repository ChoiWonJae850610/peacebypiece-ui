Version :
0.13.74

Summary :
고객사 초대 링크 계정 선점 제거와 온보딩 일괄 제출 흐름 보정

Description :
고객사 관리자 초대 링크가 Google 로그인만으로 특정 계정에 선점되거나 진행 중 상태로 표시되지 않도록 수정했다. 회사 온보딩 파일은 선택 즉시 R2에 업로드하지 않고 승인 요청 제출 시 회사 정보와 함께 FormData로 전송되도록 변경했다. 승인 요청 처리 시 초대 링크를 사용 완료 상태로 전환하도록 보정했다.

수정 파일 목록 :
- app/api/admin/companies/onboarding/route.ts
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/admin/settings/companyOnboardingRepository.ts
- lib/auth/companyInvitationLoginRepository.ts
- lib/auth/session.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
