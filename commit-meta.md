Version : 0.10.12
Summary : 시스템관리자 감사 로그 읽기 API와 화면 연결
Description : /api/system/audit-logs 읽기 API를 추가하고 /system/audit-logs 화면에 감사 로그 목록, 검색어, 대상 유형, 심각도 필터를 연결했습니다. API route는 lib/system/audit/api/routeHandlers.ts로 위임하고, 화면 데이터 조립은 server-only pageData 계층으로 분리했습니다. 실제 감사 로그 쓰기 지점은 후속 버전으로 남기고 기존 작업지시서/저장소/휴지통/R2 purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
lib/constants/app.ts
app/system/audit-logs/page.tsx
components/system/audit/SystemAuditLogsDesignPage.tsx
lib/system/audit/actionFlow.ts
lib/system/audit/systemAuditLogs.design.ts
추가 파일 목록 :
app/api/system/audit-logs/route.ts
lib/system/audit/api/routeHandlers.ts
lib/system/audit/pageData.ts
docs/system-audit-logs-api-screen-0.10.12.md
삭제 파일 목록 :
없음
