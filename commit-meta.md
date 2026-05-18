Version : 0.13.59
Summary : 고객사 무료 체험 기간과 이용 제한 기준 추가
Description : 고객사 승인 시점부터 7일 무료 체험 기간을 저장하고 trial plan 기준 및 만료 상태 계산을 추가했습니다. 고객사 관리자 온보딩 게이트에서 무료 체험 만료 안내를 표시하고, 멤버 워크스페이스는 만료 고객사 접근 시 서비스 대기 화면으로 이동하도록 보강했습니다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/admin/settings/companyOnboardingRepository.ts
- lib/admin/settings/companyTypes.ts
- lib/invitations/joinRequestRepository.ts
- lib/auth/routeGuard.ts
- lib/billing/defaultPlans.ts
- lib/billing/planPolicy.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- db/schema/full_reset.sql
- lib/constants/app.ts

추가 파일 목록 :
- lib/billing/companyTrialPolicy.ts
- lib/billing/companyAccessRepository.ts
- app/service-paused/page.tsx
- db/migrations/patch_0_13_59_company_trial_period.sql

삭제 파일 목록 :
- 없음
