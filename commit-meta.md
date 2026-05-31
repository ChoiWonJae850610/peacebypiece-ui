Version : 0.18.75
Summary : 통계정보 bar row 소스 정리
Description : 통계정보 분석 카드에서 반복되던 막대형 row 렌더링을 AdminStatsBarRow helper로 정리했습니다. 기간 상위 목록과 bar list 카드가 같은 row 렌더링 기준을 공유하며 통계 계산, 탭 전환, 기간 선택/적용 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsAnalysisCards.tsx
추가 파일 목록 :
- docs/stats-bar-row-cleanup-0.18.75.md
삭제 파일 목록 :
없음
