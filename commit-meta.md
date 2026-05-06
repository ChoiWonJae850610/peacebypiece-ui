Version : 0.9.2222
Summary : 통계 분석 섹션 재구성
Description : 고객관리자 통계정보 화면에서 기간별 리오더 TOP5, 생산품 유형 차수별 분석, 업체별 납기·검수 지표를 실제 집계 기준에 맞게 보강했다. 리오더 TOP5는 제품명 기준으로 표시하고, 생산품 유형 분석은 1차/2차/3차 이상 선택에 따라 도넛 그래프와 TOP5가 함께 바뀌도록 정리했다. 업체 성과는 제작 건수, 납기 지연율, 검수/불량률을 한 화면에서 확인하도록 보완했다. DB schema, API route, package 의존성은 변경하지 않는다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/admin/stats/types.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/admin-stats-analysis-sections-0.9.2222.md
삭제 파일 목록 :
없음
