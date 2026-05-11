Version : 0.10.15
Summary : 작업지시서 상태 변경 감사 로그 연결
Description : 작업지시서 workflowState 변경을 시스템관리자 감사 로그에 work_order.status_changed 이벤트로 기록하도록 연결했습니다. 기존 고객관리자 history_logs 상태 변경 이력은 유지하고, 감사 로그 쓰기 실패가 작업지시서 저장/상태 변경 동작을 막지 않도록 safe wrapper를 사용했습니다. DB schema와 기존 삭제/복원/저장소 purge 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/audit/writeActions.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- components/system/audit/SystemAuditLogsDesignPage.tsx
- lib/system/audit/systemAuditLogs.design.ts
- lib/system/systemConsoleShell.ts

추가 파일 목록 :
- docs/system-audit-logs-workorder-status-0.10.15.md

삭제 파일 목록 :
- 없음
