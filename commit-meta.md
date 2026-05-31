Version : 0.18.77
Summary : 통계정보 업체 성과 테이블 컴포넌트 분리
Description : 통계정보 분석 카드에 남아 있던 업체 성과 테이블 렌더링 책임을 AdminStatsFactoryPerformanceTable로 분리했습니다. 공통 responsive table shell 사용 구조와 통계 계산, 탭 전환, 기간 선택/적용 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/dashboard/AdminStatsAnalysisCards.tsx
추가 파일 목록 :
- components/admin/dashboard/AdminStatsFactoryPerformanceTable.tsx
- docs/stats-factory-performance-table-component-0.18.77.md
삭제 파일 목록 :
없음
