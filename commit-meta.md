Version : 0.18.38
Summary : 저장소관리 요약 카드 소스 정리
Description : 저장소관리 요약 카드의 container width 반응형 동작은 유지하면서 FileStorageSummary에 몰려 있던 layout 계산, 용량 카드, 운영 요약 카드, 파일 유형 차트 카드, 원통 그래프 표시 책임을 분리했습니다. WorkspaceShell과 DB/API/R2/휴지통 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/FileStorageSummary.tsx
추가 파일 목록 :
- components/admin/files/summary/storageSummaryLayout.ts
- components/admin/files/summary/StorageCylinder.tsx
- components/admin/files/summary/PlanUsageCard.tsx
- components/admin/files/summary/FileOperationsCard.tsx
- components/admin/files/summary/FileTypeChartCard.tsx
- docs/storage-summary-source-cleanup-0.18.38.md
삭제 파일 목록 :
- 없음
