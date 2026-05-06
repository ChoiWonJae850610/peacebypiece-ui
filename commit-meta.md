Version :
0.9.2071

Summary :
통계 확인용 seed 데이터와 빈 상태 안내 보강

Description :
통계 화면이 빈 DB 상태에서 변화가 작게 보이는 문제를 줄이기 위해 개발용 통계 seed SQL을 추가했다. 고객관리자 통계 화면에는 데이터가 없을 때 full reset, smoke test, seed SQL 실행 순서를 안내하는 empty state를 추가하고, 도넛 차트의 빈 상태 표시를 보강했다. 원래 예정된 Standard/Growth 통계 1차 작업은 0.9.208로 유지한다.

수정 파일 목록 :
- components/admin/dashboard/AdminBasicStatsCharts.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- db/schema/seed_stats_demo_0_9_2071.sql
- docs/stats-demo-data-0.9.2071.md

삭제 파일 목록 :
없음
