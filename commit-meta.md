Version : 0.9.115
Base Version : 0.9.114
Target Version : 0.9.115
Summary : 고객관리자 통계 상세 read-only 화면 추가
Description : /admin/stats route와 AdminStatsReadOnlyPage를 추가해 기존 GET /api/admin/stats?companyId=... API 기반 StatsSummary의 count, ratio, series를 고객사 기준 read-only로 상세 표시했습니다. 상태별 작업지시서 count를 별도 영역으로 분리하고 chart library 추가 없이 HTML/Tailwind 기반 bar 표현만 사용합니다. stats repository/API 응답 포맷, DB schema, package.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/adminConsoleShell.ts
추가 파일 목록 :
- app/admin/stats/page.tsx
- components/admin/stats/AdminStatsReadOnlyPage.tsx
- docs/admin/admin_stats_readonly.md
삭제 파일 목록 :
- 없음
