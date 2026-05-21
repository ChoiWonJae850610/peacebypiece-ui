Version :
0.15.30

Summary :
빌드 타입 오류 수정과 도메인 상수 타입 1차 정리

Description :
AdminUserAccessPreview의 영문 i18n key 누락으로 발생한 빌드 타입 오류를 수정했다. usage risk와 file kind 도메인 상수 및 helper를 추가하고 시스템 요금제 화면과 저장소 파일 유형 분류에서 한글 표시 문구 기반 비교 일부를 제거했다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/admin/adminFiles.presentation.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/system/systemCompanyPlanSkeleton.ts

추가 파일 목록 :
- docs/wafl-a-type/53_wafl-a-type-domain-constants-types.md
- lib/domain/fileKind.ts
- lib/domain/usageRisk.ts

삭제 파일 목록 :
없음
