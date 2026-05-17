Version :
0.13.52

Summary :
고객사 관리자 첫 로그인 회사정보 입력 구조 추가

Description :
고객사 관리자가 첫 로그인 후 회사명, 사업자명, 주소, 관리자 연락처, 신청 요금제를 입력해야 관리자 화면을 사용할 수 있도록 회사 온보딩 게이트와 저장 API를 추가했다. 회사 주소와 온보딩 상태 저장을 위해 companies 컬럼 보강 SQL과 full_reset.sql도 함께 반영했다.

수정 파일 목록 :
- app/admin/layout.tsx
- db/schema/full_reset.sql
- lib/admin/settings/companyTypes.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
- app/api/admin/companies/onboarding/route.ts
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- db/migrations/patch_0_13_52_company_onboarding.sql
- lib/admin/settings/companyOnboardingRepository.ts

삭제 파일 목록 :
없음
