Version :
0.13.70

Summary :
시스템관리자 고객사 관리 목록과 승인 거절 상태 로직 보정

Description :
시스템관리자 고객사 관리 화면에서 승인 대기뿐 아니라 승인됨, 거절됨 상태의 고객사 가입 이력도 함께 확인하도록 목록 구조를 보정했다. 고객사 승인 로직에서 현재 schema와 맞지 않는 회사 상태/요금제 컬럼 참조를 제거했고, 거절된 고객사는 rejected 상태로 보존하면서 관리자 접근을 차단하도록 수정했다. rejected onboarding status를 full_reset과 migration에 반영했다.

수정 파일 목록 :
- app/admin/layout.tsx
- app/service-paused/page.tsx
- components/admin/billing/AdminCompanyAccessGate.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- db/schema/full_reset.sql
- lib/admin/settings/companyOnboardingRepository.ts
- lib/admin/settings/companyTypes.ts
- lib/auth/routeGuard.ts
- lib/billing/companyAccessRepository.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/constants/app.ts

추가 파일 목록 :
- db/migrations/patch_0_13_70_company_rejected_status.sql

삭제 파일 목록 :
없음
