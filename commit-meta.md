Version :
0.9.141

Summary :
시스템관리자 R2 purge 수동 실행 1차 연결

Description :
/system/storage-usage 삭제 후보 목록에서 선택 항목 또는 전체 도래 항목을 Worker 기반으로 실제 삭제할 수 있도록 API와 클라이언트 UI를 연결했다. 삭제 대상은 원본 storage_key와 thumbnail_key를 함께 처리하며, 성공 시 purge 완료 상태를 기록하고 실패 시 실패 사유를 남기도록 했다. 자동 purge, DB schema 변경, R2 직접 SDK 삭제는 포함하지 않았다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- app/api/system/storage-usage/purge/route.ts
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- docs/system-storage-purge-execution-0.9.141.md

삭제 파일 목록 :
없음
