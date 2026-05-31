Version : 0.18.58
Summary : 통계정보 분석 카드 소스 정리
Description : 통계정보 화면의 분석 영역 카드 렌더링 책임을 AdminStatsAnalysisCards로 분리했습니다. AdminStatsDashboard는 상태와 데이터 계산, 화면 조합 중심으로 유지하며 기존 통계 탭, 그래프, 기간 선택, 테이블 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx
추가 파일 목록 :
- components/admin/dashboard/AdminStatsAnalysisCards.tsx
- docs/stats-analysis-cards-source-cleanup-0.18.58.md
삭제 파일 목록 :
- 없음
