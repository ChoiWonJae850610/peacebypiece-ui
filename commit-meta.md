Version :
0.10.72

Summary :
저장소 용량 기준 중앙화

Description :
저장소 용량 한도와 사용률 계산 기준을 billing storage quota policy로 분리하고, 고객관리자 저장소와 통계, 시스템 저장소 화면이 같은 기본 quota 기준을 참조하도록 보정했다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- app/system/storage-usage/page.tsx
- lib/admin/adminDashboard.presentation.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/stats/selectors.ts
- lib/billing/index.ts
- lib/constants/adminStats.ts
- lib/constants/app.ts
- lib/system/storagePurgePresentation.ts

추가 파일 목록 :
- lib/billing/storageQuotaPolicy.ts
- docs/storage-quota-centralization-0.10.72.md

삭제 파일 목록 :
없음
