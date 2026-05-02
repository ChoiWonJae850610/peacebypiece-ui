Version : 0.9.107
Base Version : 0.9.106
Target Version : 0.9.107
Summary : 고객관리자 콘솔 통계 read-only 표시
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin 홈을 AdminConsoleShell 본 화면으로 재연결하고, 기존 GET /api/admin/stats?companyId=...를 사용해 고객관리자 통계를 read-only로 표시하도록 복원했습니다. 작업지시서 수, 첨부파일 수, 저장공간 사용량, 완료율, 상태별 수, 월별 series와 고객관리자 하위 route/API 진입점을 표시하며 저장 action, chart library, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/page.tsx
추가 파일 목록 :
- components/admin/AdminConsoleShell.tsx
- lib/admin/adminConsoleShell.ts
- docs/admin/admin_console_stats_readonly.md
삭제 파일 목록 :
- 없음
