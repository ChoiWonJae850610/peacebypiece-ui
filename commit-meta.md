Version : 0.9.2226
Summary : 통계 화면 UI 정리와 날짜 선택 정책 보강
Description : 고객관리자 통계정보 화면의 중복 헤더, 불필요한 안내 문구, 하단 대시보드형 요약 카드를 제거했다. 직접 기간 선택에서 시작일/종료일의 선택 가능 범위를 오늘 기준으로 제한하고, 키 입력과 붙여넣기를 차단했다. 업체별 납기·검수 지표에는 hover 상세를 추가해 납기 지연 및 검수/불량 후보 관련 작업지시서명을 확인할 수 있도록 보강했다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/admin/stats/types.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/admin-stats-cleanup-0.9.2226.md
삭제 파일 목록 :
