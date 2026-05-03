Version :
0.9.140

Summary :
시스템관리자 R2 실제 삭제 후보 화면 1차 추가

Description :
전 고객 공통 30일 휴지통 정책을 기준으로 시스템관리자가 R2 실제 삭제 후보를 확인할 수 있는 /system/storage-usage 화면을 추가했다. 후보 목록에는 고객사명, 작업지시서명, 파일명, 삭제일, 삭제 예정일, 원본 storage_key, 썸네일 thumbnail_key, purge 상태를 표시한다. 기존 시스템 콘솔의 스토리지 버튼은 즉시 purge 실행 모달이 아니라 후보 목록 화면으로 이동하도록 변경했다. 실제 R2 삭제 실행은 아직 연결하지 않았고, 선택 삭제/전체 삭제 버튼은 비활성 상태로 유지했다.

수정 파일 목록 :
- components/system/SystemConsoleShell.tsx
- components/system/storage/SystemStoragePurgeButton.tsx
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- app/system/storage-usage/page.tsx
- lib/system/storagePurgeCandidates.ts
- docs/system-storage-purge-candidates-0.9.140.md

삭제 파일 목록 :
없음
