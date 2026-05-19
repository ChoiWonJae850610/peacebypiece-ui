Version :
0.14.3

Summary :
시스템관리자 부트스트랩 SQL과 고객사 온보딩 입력 보정

Description :
kty872@gmail.com 계정을 시스템관리자로 등록하는 부트스트랩 SQL을 추가했다. 고객사 온보딩 사업자등록번호 입력은 3-2-5 형식으로 자동 하이픈 처리되도록 보정하고, 최초 신청 요금제는 무료 Trial 7일 읽기 전용으로 고정했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/admin/settings/companyOnboardingRepository.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/utils/businessRegistrationFormat.ts
- db/seed/system_admin_bootstrap_kty872.sql

삭제 파일 목록 :
없음
