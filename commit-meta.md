Version :
0.9.2219

Summary :
성능/캐시/summary 기준 시스템관리자 이동

Description :
고객관리자 통계정보 화면에서 통계 API 캐싱 기준, summary table/materialized view 검토, 성능 측정 기준을 제거하고 시스템관리자 통계 상황판으로 이동했다. 고객관리자 통계 화면은 생산 흐름, 생산 분석, 협력업체 성과, 리오더, 품질/납기 준비 상태 중심으로 유지한다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/system/SystemStatsOverview.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-operation-move-0.9.2219.md

삭제 파일 목록 :
없음
