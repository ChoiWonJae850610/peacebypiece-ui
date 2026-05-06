Version :
0.9.2211

Summary :
관리자 통계 화면 요금제 선택 구조 도입

Description :
관리자 통계 화면에서 Basic, Standard, Growth, Premium 통계가 한 화면에 모두 나열되던 구조를 상단 요금제 선택 방식으로 정리했다. 선택된 요금제에 따라 아래 통계 본문이 단계적으로 바뀌며, 운영/개발 기준 영역은 runtime debug flag가 켜진 경우에만 표시되도록 분리했다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/runtimeMode.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-plan-filter-0.9.2211.md

삭제 파일 목록 :
없음
