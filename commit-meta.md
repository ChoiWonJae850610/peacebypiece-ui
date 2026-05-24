Version : 0.16.13
Summary : fallback/mock/legacy 정리 1차
Description : 관리자 점검/DB 연결 감사 메타데이터에서 fallback/mock 표현을 빈 상태/seed/fixture 기준으로 정리하고, /admin 화면 경로 감사 문자열을 /workspace 기준으로 갱신했습니다. DB 연결 상태 표시의 LOCAL FALLBACK 사용자 노출 문구를 DB 확인 필요로 보정했으며, 실제 API 경로와 DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx
- lib/admin/completionAudit.ts
- lib/admin/dbCompletionAudit.ts
- lib/admin/dbIntegration.ts
- lib/admin/mockDataAudit.ts
- lib/admin/structureAudit.ts
- lib/constants/app.ts
- lib/repositories/dbConnectionStatusPresentation.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
