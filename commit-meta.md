Version : 0.18.70
Summary : 통계정보 선택 기간 표시 범위 보정
Description : 통계정보 화면에서 선택 기간 badge가 생산 구성/업체 성과 탭과 운영 누적 지표까지 기간 기준으로 오해되게 보이는 문제를 줄이기 위해, 운영 누적 지표의 선택 기간 badge를 제거하고 작업흐름분석 선택 기간 badge는 기간 분석 탭에서만 표시되도록 보정했습니다. 통계 계산, 기간 선택/적용, DB/API 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/dashboard/AdminStatsOverviewSection.tsx
추가 파일 목록 :
- docs/stats-selected-period-badge-scope-0.18.70.md
삭제 파일 목록 :
- 없음
