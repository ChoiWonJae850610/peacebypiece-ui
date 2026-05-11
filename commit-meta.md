Version : 0.10.10
Summary : 시스템관리자 감사 로그 DB 설계 확정
Description : 시스템관리자 감사 로그 원장을 audit_logs 테이블로 분리하는 DB schema를 추가했습니다. patch SQL, full_reset, smoke test를 갱신하고 /system/audit-logs 설계 화면과 문서에 확정 기준을 반영했습니다. 기존 고객관리자 history_logs와 작업지시서/저장소/휴지통/R2 purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- components/system/audit/SystemAuditLogsDesignPage.tsx
- lib/system/audit/systemAuditLogs.design.ts
추가 파일 목록 :
- db/schema/patch_0_10_10_audit_logs.sql
- docs/system-audit-logs-db-schema-0.10.10.md
삭제 파일 목록 :
