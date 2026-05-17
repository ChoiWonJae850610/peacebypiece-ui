Version :
0.13.33

Summary :
환경설정 회사 범위 기준과 설정 fallback 제거

Description :
환경설정과 회사설정 조회·저장 API가 실제 로그인 세션의 companyId 기준으로 동작하도록 보강했다. 현재 회사 조회 실패 시 고정 회사 fallback을 반환하지 않도록 제거하고, 기준정보 설정 API도 세션 회사 범위를 repository에 명시적으로 전달하도록 정리했다.

수정 파일 목록 :
- app/api/admin/companies/current/route.ts
- app/api/admin/companies/route.ts
- app/api/admin/standards/route.ts
- app/admin/settings/page.tsx
- components/admin/settings/AdminSettingsHub.tsx
- lib/admin/settings/adminBillingPlanPlaceholder.ts
- lib/admin/settings/companyDefaults.ts
- lib/admin/settings/companyRepository.ts
- lib/admin/settings/standardsDefaults.ts
- lib/admin/settings/standardsRepository.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
- lib/admin/settings/sessionScope.ts

삭제 파일 목록 :
없음
