Version : 0.18.84
Summary : 통계정보 기간 컨트롤 소스 정리
Description : AdminStatsDashboard에 있던 기간 선택 상태, 프리셋 처리, 날짜 검증, 적용 링크 계산 로직을 useAdminStatsPeriodControls hook으로 분리했습니다. UI 결과와 통계 계산, DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts
추가 파일 목록 :
- components/admin/dashboard/useAdminStatsPeriodControls.ts
- docs/stats-period-controls-source-cleanup-0.18.84.md
삭제 파일 목록 :
