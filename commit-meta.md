Version :
0.14.1

Summary :
고객사 계정 정보 변경 요청 접수 흐름 추가

Description :
고객사 관리자 환경설정의 계정 정보 화면에서 회사 정보 변경 요청과 계정 비활성화 요청을 작성해 시스템관리자 검토 요청으로 접수할 수 있게 했다. 요청 저장용 DB 테이블과 API route를 추가하고 full_reset 및 smoke test 기준을 함께 보정했다.

수정 파일 목록 :
- components/admin/settings/AdminSettingsHub.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/admin/settings/adminAccountSettingsOverview.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/admin/settings/company-account-requests/route.ts
- lib/admin/settings/companyAccountRequestRepository.ts

삭제 파일 목록 :
없음
