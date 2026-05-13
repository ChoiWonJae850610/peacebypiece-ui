Version :
0.11.23

Summary :
관리자 통계 화면 공통 UI 컴포넌트 적용

Description :
관리자 통계 화면의 기간 선택 버튼, 섹션 탭, 생산 구성 depth 전환, 기간 분석 링크를 AdminButton/AdminLinkButton 기준으로 전환했습니다. 업체별 납기/검수 지표 표를 AdminTable로 전환하고 지표 라벨을 AdminStatusBadge로 정리했으며, Top list empty state를 AdminEmptyState로 표시하도록 보완했습니다. 통계 API, DB schema, 통계 계산식, 차트 구조는 변경하지 않았습니다.

수정 파일 목록 :
components/admin/dashboard/AdminStatsDashboard.tsx
lib/constants/app.ts

추가 파일 목록 :
docs/admin-stats-common-ui-standardization-0.11.23.md

삭제 파일 목록 :
없음
