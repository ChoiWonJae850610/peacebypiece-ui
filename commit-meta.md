Version :
0.9.2213

Summary :
관리자 통계 화면 요금제별 재배치와 시각 밀도 보정

Description :
관리자 통계 화면에서 요금제 선택 시 카드가 아래로 계속 누적되는 구조를 줄이고, Basic, Standard, Growth, Premium별로 KPI와 메인 차트가 재배치되도록 정리했다. runtime flag에 adminStatsPlanSwitcher를 추가해 개발 중에는 요금제 선택 UI를 표시하고, 서비스 전에는 숨길 수 있게 했다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/runtimeMode.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-visual-density-0.9.2213.md

삭제 파일 목록 :
없음
