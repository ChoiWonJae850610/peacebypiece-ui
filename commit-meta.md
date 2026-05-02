Version : 0.9.114
Base Version : 0.9.113
Target Version : 0.9.114
Summary : 시스템 통계 상세 read-only 화면 추가
Description : /system/stats route와 SystemStatsReadOnlyPage를 추가해 기존 GET /api/system/stats API 기반 StatsSummary의 count, ratio, series를 read-only로 상세 표시했습니다. chart library 추가 없이 HTML/Tailwind 기반 bar 표현만 사용하며 stats repository/API 응답 포맷, DB schema, package.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- app/system/stats/page.tsx
- components/system/stats/SystemStatsReadOnlyPage.tsx
- docs/system/system_stats_readonly.md
삭제 파일 목록 :
- 없음
