Version : 0.10.13
Summary : 시스템관리자 감사 로그 쓰기 지점 1차 연결
Description : 시스템관리자 저장소 실제 삭제 API에 storage.purge_run 감사 로그 기록을 연결했습니다. 감사 로그 쓰기 실패가 기존 삭제 처리를 막지 않도록 safe wrapper를 사용하고, 삭제 결과 요약과 항목 상태를 metadata에 구조화했습니다. 기존 작업지시서/저장소/휴지통/R2 purge 처리 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/api/system/storage-usage/purge/route.ts
- components/system/audit/SystemAuditLogsDesignPage.tsx
- lib/system/audit/index.ts
- lib/system/audit/systemAuditLogs.design.ts
- lib/system/systemConsoleShell.ts

추가 파일 목록 :
- lib/system/audit/writeActions.ts
- docs/system-audit-logs-write-0.10.13.md

삭제 파일 목록 :
- 없음
