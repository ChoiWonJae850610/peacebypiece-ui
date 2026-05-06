Version :
0.9.2215

Summary :
관리자 통계 하위 요금제 포함 구조 보정

Description :
관리자 통계 화면에서 Standard, Growth, Premium 선택 시 하위 요금제 통계가 보이지 않는 것처럼 느껴지는 문제를 줄이기 위해 Basic 포함 통계 섹션을 별도로 추가했다. Included Plan 배지는 클릭 버튼이 아니라 포함 범위 표시로 보이도록 정리했다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-included-basic-0.9.2215.md

삭제 파일 목록 :
없음
