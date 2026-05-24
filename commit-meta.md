Version : 0.16.23
Summary : 통계 저장소 감사로그 충돌 점검
Description : 원단·부자재 구조 추가 이후 저장소, 통계, 시스템 감사로그 경계가 섞이지 않도록 점검 문서를 추가하고 시스템 체크포인트와 감사로그 target type을 보정했습니다. /system/storage-usage 안내 문구는 /workspace/files 기준으로 갱신했으며 R2, 첨부, 메모, 휴지통, purge 동작과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- app/(system)/system/audit-logs/page.tsx
- lib/constants/app.ts
- lib/system/audit/types.ts
- lib/system/storagePurgePresentation.ts
- lib/system/systemAccessStabilityCheckpoint.ts
추가 파일 목록 :
- docs/workspace-system-integration-checkpoint.md
삭제 파일 목록 :
- 없음
