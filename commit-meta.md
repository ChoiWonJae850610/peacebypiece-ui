Version :
0.9.2224

Summary :
통계 직접 기간 선택 DB 조회 연결

Description :
고객관리자 통계정보 화면에서 직접 선택한 시작일과 종료일이 실제 DB 집계 조건에 반영되도록 연결했다. 기간 query는 /admin/dashboard?period=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD 형식으로 유지하며, 잘못된 날짜 범위는 최근 30일 기준으로 fallback한다. 상단 현재 시점 요약은 기간 필터 영향을 받지 않고, 작업흐름분석 이하 기간별 분석 영역만 선택 기간 기준으로 조회한다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- app/admin/dashboard/page.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/admin/stats/selectors.ts
- lib/admin/stats/types.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-custom-period-0.9.2224.md

삭제 파일 목록 :
없음
