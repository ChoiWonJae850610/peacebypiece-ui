Version : 0.10.9
Summary : 시스템관리자 감사 로그 설계 화면 추가
Description : /system/audit-logs 설계 화면을 추가하고 시스템 홈에서 감사 로그 진입을 연결했습니다. 고객관리자 메뉴에서는 히스토리 노출을 제거해 상세 운영 이력을 시스템관리자 감사 로그로 분리하는 방향을 반영했습니다. DB schema와 기존 작업지시서/저장소/휴지통/R2 purge 동작은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- lib/admin/adminDashboard.presentation.ts
- lib/admin/adminConsoleLinks.ts
추가 파일 목록 :
- app/system/audit-logs/page.tsx
- components/system/audit/SystemAuditLogsDesignPage.tsx
- lib/system/audit/systemAuditLogs.design.ts
- docs/system-audit-logs-design-0.10.9.md
삭제 파일 목록 :
