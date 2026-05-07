Version : 0.9.22272
Summary : 생산품 유형 세부 분석 카드 구조 보정
Description : 통계정보 화면의 생산품 유형 분석에서 세분류 전체 TOP5를 별도로 반복 표시하던 구조를 제거하고, 선택한 대분류 또는 품목의 하위 항목을 오른쪽 카드에서 보여주도록 변경했다. 대분류 선택 시 품목 TOP5, 품목 선택 시 세부형태 TOP5를 표시하며, 도넛 차트 목록 항목을 클릭하면 세부 분석 대상이 바뀐다. DB schema, package 의존성은 변경하지 않는다.
수정 파일 목록 :
components/admin/dashboard/AdminStatsDashboard.tsx
components/admin/dashboard/AdminBasicStatsCharts.tsx
lib/admin/adminStats.repository.ts
lib/admin/stats/types.ts
lib/constants/app.ts
추가 파일 목록 :
docs/stats-category-drilldown-0.9.22272.md
삭제 파일 목록 :
없음
