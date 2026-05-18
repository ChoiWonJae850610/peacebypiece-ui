Version :
0.13.62

Summary :
고객사 온보딩 파일 업로드 API 추가

Description :
고객사 온보딩 로고와 사업자등록증 파일을 Worker 기반 R2 업로드로 저장하고 company_onboarding_files metadata를 기록하는 업로드 API를 추가했다. 업로드 파일 정책과 storage key 검증을 보강하고, 승인 전 파일 삭제 API와 관련 i18n 문구를 추가했다.

수정 파일 목록 :
- lib/admin/settings/companyOnboardingFilePolicy.ts
- lib/admin/settings/companyOnboardingFileRepository.ts
- lib/storage/r2/r2WorkerUpload.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/admin/companies/onboarding/files/upload/route.ts
- app/api/admin/companies/onboarding/files/delete/route.ts
- lib/admin/settings/companyOnboardingFileService.ts

삭제 파일 목록 :
없음
