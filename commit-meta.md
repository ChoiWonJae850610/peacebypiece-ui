Version :
0.9.2216

Summary :
관리자 통계 화면 최종 시각 밀도 점검

Description :
관리자 통계 화면에서 요금제 포함 범위를 대형 카드가 아니라 상단 compact scope bar로 표시하도록 정리했다. Included Plan Summary 대형 카드는 제거하고, Standard 이상에서 Basic 핵심 통계가 별도 섹션으로 유지되도록 했다. 요금제 선택 UI와 운영/개발 기준은 기존 runtime flag 정책을 유지한다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-visual-density-0.9.2216.md

삭제 파일 목록 :
없음
