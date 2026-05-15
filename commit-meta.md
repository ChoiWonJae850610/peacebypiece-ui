Version : 0.12.72
Summary : 통계정보 route와 도넛 그래프 표시 정리
Description : /admin/dashboard 통계 화면을 /admin/stats로 분리하고 기존 route는 redirect로 유지했습니다. 통계 화면 링크와 기간 선택 href를 /admin/stats 기준으로 정리했으며, 통계 탭 i18n 키를 추가했습니다. 도넛 그래프 중앙 표시는 숫자와 단위를 두 줄로 분리하고 중복 단위를 제거했으며, tooltip 위치와 세그먼트 색상 대비를 보정했습니다. DB schema, 통계 계산 로직, 품목/카테고리 데이터값 i18n은 변경하지 않았습니다.
수정 파일 목록 :
- app/admin/dashboard/page.tsx
- components/admin/dashboard/AdminBasicStatsCharts.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminDashboard.presentation.ts
- lib/admin/adminWorkspaceCards.ts
- lib/admin/dbIntegration.ts
- lib/admin/structureAudit.ts
- lib/admin/stats/performancePolicy.ts
- lib/admin/stats/selectors.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/theme/semanticThemeTokens.ts
추가 파일 목록 :
- app/admin/stats/page.tsx
삭제 파일 목록 :
- 없음
