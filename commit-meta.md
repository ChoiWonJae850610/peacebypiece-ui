Version :
0.9.211

Summary :
R2 purge와 저장소 통계 상태 구분 보강

Description :
시스템 관리자 통계와 스토리지 실제 삭제 화면에서 R2 purge 상태를 영구삭제 요청, 삭제 대기, 삭제 완료, 삭제 실패로 분리해 표시했다. 스토리지 purge 후보 summary에 요청/대기/실패/재시도 수를 추가하고, 시스템 통계에는 active/trash/purged 저장소 구분 기준을 추가했다. 기존 Worker 기반 R2 삭제 흐름, DB schema, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/SystemStatsOverview.tsx
- lib/system/systemStats.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-purge-stats-0.9.211.md

삭제 파일 목록 :
없음
