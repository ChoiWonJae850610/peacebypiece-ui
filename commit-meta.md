Version : 0.18.82
Summary : 통계정보 분석 header 컨테이너 폭 기준 보정
Description : 통계정보 분석 통계 header에서 탭 위치가 태블릿 기기별로 다르게 보이는 문제를 줄이기 위해 viewport breakpoint 대신 실제 header container 폭 기준으로 inline/stacked layout을 결정하도록 보정했습니다. 통계 계산, 탭 전환, 기간 선택/적용, DB/API 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsWorkflowSection.tsx
추가 파일 목록 :
- docs/stats-workflow-header-container-width-0.18.82.md
삭제 파일 목록 :
없음
