Version :
0.15.31

Summary :
중복 formatter와 presentation 유틸 1차 통합

Description :
숫자, 금액, 수량 단위, 저장공간 용량 표기 formatter를 lib/utils/formatters.ts로 1차 통합했다. billing, system, admin stats, admin files 일부 화면의 중복 formatter는 기존 공개 함수명을 유지한 채 공통 formatter로 위임하도록 정리했다. DB/API/R2/권한/세션 흐름은 변경하지 않았다.

수정 파일 목록 :
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/admin/files/storageSummaryPresentation.ts
- lib/admin/settings/adminBillingPlanPlaceholder.ts
- lib/admin/stats/featureGate.ts
- lib/admin/stats/selectors.ts
- lib/billing/companyPlanChangePolicy.ts
- lib/billing/storageQuotaPolicy.ts
- lib/constants/app.ts
- lib/system/systemCompanyPlanSkeleton.ts

추가 파일 목록 :
- docs/wafl-a-type/54_wafl-a-type-formatter-presentation-consolidation.md
- lib/utils/formatters.ts

삭제 파일 목록 :
없음
