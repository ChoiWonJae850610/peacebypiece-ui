Version :
0.9.209

Summary :
Premium 통계 준비 상태 표시

Description :
고객관리자 통계 화면에 Premium 통계 준비 상태 섹션을 추가했다. 검수/불량률, 납기 지연율, 공장별 비용/위험, 통계 내보내기의 현재 가능 여부와 후속 설계 항목을 표시한다. 이번 버전은 DB schema, API route, package 의존성을 변경하지 않고 Premium 통계 데이터 기준을 먼저 확정하기 위한 준비 작업으로 처리했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/stats/featureGate.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/stats-premium-readiness-0.9.209.md

삭제 파일 목록 :
없음
