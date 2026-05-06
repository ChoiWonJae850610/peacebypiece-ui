Version :
0.9.2214

Summary :
관리자 통계 화면 요금제 포함 구조 정리

Description :
관리자 통계 화면에서 상위 요금제가 하위 요금제 통계를 포함한다는 정책을 화면 구조에 반영했다. Basic, Standard, Growth, Premium 선택 시 카드가 단순 누적되지 않도록 선택 요금제의 핵심 지표를 먼저 배치하고, 하위 요금제 통계는 포함 범위와 보조 지표 요약으로 압축 표시했다. 요금제 선택 UI와 운영/개발 기준 영역은 기존 runtime flag 기준을 유지한다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-plan-layout-0.9.2214.md

삭제 파일 목록 :
없음
