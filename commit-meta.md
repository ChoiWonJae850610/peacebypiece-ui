Version : 0.10.11
Summary : 시스템관리자 감사 로그 계층 분리
Description : audit_logs 접근 구조를 lib/system/audit 계층으로 분리했습니다. repository, types, selectors, actionFlow를 추가하고 /system/audit-logs 설계 화면에 0.10.11 계층 분리 기준을 반영했습니다. DB schema와 기존 작업지시서/저장소/휴지통/R2 purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
lib/constants/app.ts
lib/system/audit/systemAuditLogs.design.ts
components/system/audit/SystemAuditLogsDesignPage.tsx
lib/system/systemConsoleShell.ts
추가 파일 목록 :
lib/system/audit/types.ts
lib/system/audit/repository.ts
lib/system/audit/selectors.ts
lib/system/audit/actionFlow.ts
lib/system/audit/index.ts
docs/system-audit-logs-layering-0.10.11.md
삭제 파일 목록 :
없음
