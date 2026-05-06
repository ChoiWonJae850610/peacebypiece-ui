Version :
0.9.205

Summary :
고객 관리자 Basic 통계 차트 1차 적용

Description :
Recharts를 고객 관리자 통계 화면에 실제 연결했다. 작업지시서 상태별 현황은 막대 차트로, 협력업체 분포와 파일 사용량 및 생산 단계 비율은 도넛 차트로 표시하도록 공통 차트 컴포넌트를 추가했다. 기존 통계 repository, API, DB schema, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/dashboard/AdminBasicStatsCharts.tsx
- docs/stats-basic-dashboard-0.9.205.md

삭제 파일 목록 :
없음
