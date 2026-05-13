Version :
0.11.58

Summary :
통계 기간분석 탭 동작 분리

Description :
관리자 통계 화면에서 기간분석 탭의 기간 필터를 조작해도 생산 구성 탭으로 돌아가지 않도록 section query를 유지했다. 생산 구성과 업체 성과 분포 데이터는 누적 기준으로 유지하고, 기간분석 탭의 기간 요약과 Top5만 선택 기간 기준으로 동작하도록 보정했다. 초기화 버튼도 텍스트 버튼으로 정리했다.

수정 파일 목록 :
- app/admin/dashboard/page.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/qa-admin-dashboard-period-tab-0.11.58.md

삭제 파일 목록 :
없음
