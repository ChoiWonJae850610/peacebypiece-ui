Version :
0.13.61

Summary :
고객사 온보딩 파일 metadata 구조와 필수값 오류 문구 보정

Description :
고객사 온보딩 로고와 사업자등록증 업로드를 위한 DB metadata 테이블, migration, R2 storage key 정책, 파일 mime/size 정책, metadata repository를 추가했다. 온보딩 모달에서 사업자등록번호와 상세주소 필수 표시 및 클라이언트 검증 누락을 보정하고, COMPANY_ONBOARDING_REQUIRED_FIELDS 코드가 화면에 그대로 노출되지 않도록 i18n 오류 문구 매핑을 추가했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- db/schema/full_reset.sql
- lib/admin/settings/companyTypes.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts

추가 파일 목록 :
- db/migrations/patch_0_13_61_company_onboarding_files.sql
- lib/admin/settings/companyOnboardingFilePolicy.ts
- lib/admin/settings/companyOnboardingFileRepository.ts

삭제 파일 목록 :
없음
