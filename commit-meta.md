Version : 0.9.89
Base Version : 0.9.88
Target Version : 0.9.89
Summary : storage usage DB 집계 연결
Description : storage usage repository를 in-memory skeleton에서 DB 기반 조회/저장 구조로 전환하고, attachments metadata 기준 사용량 집계 snapshot 생성을 추가했습니다. latest_storage_usage_snapshots 조회와 attachment metadata aggregate를 연결했으며 R2 실시간 조회와 초과 차단 정책은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/billing/storageUsageRepository.ts
- lib/billing/api/storageUsageRouteHandlers.ts
- lib/billing/index.ts
추가 파일 목록 :
- docs/billing/storage_usage_db_aggregation.md
삭제 파일 목록 :
- 없음
