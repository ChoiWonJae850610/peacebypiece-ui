Version : 0.9.2225
Summary : 통계 직접 기간 선택 UX와 도넛 빈 상태 표시 정리
Description : 고객관리자 통계정보 화면의 직접 기간 선택 적용 조건과 안내 문구를 정리했다. 시작일과 종료일이 모두 있고 날짜 순서가 올바른 경우에만 직접 선택 적용 버튼이 활성화되도록 했으며, 생산품 유형 도넛 차트의 빈 데이터 상태에서 중앙 총합 텍스트와 빈 상태 문구가 겹치지 않도록 수정했다. DB schema, API route, package 의존성은 변경하지 않는다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/dashboard/AdminBasicStatsCharts.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/admin-stats-period-ux-0.9.2225.md
삭제 파일 목록 :
없음
