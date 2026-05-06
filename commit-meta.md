Version :
0.9.2217

Summary :
관리자 통계 화면 단일 분석 구조 전환

Description :
관리자 통계 화면에서 요금제별 선택 구조를 제거하고 생산 흐름, 협력업체 성과, 리오더, 품질/납기 준비 상태 중심의 단일 분석 화면으로 재구성했다. 대시보드와 저장소 메뉴에서 이미 다루는 정보는 통계 화면에서 요약 수준으로 낮추고, 운영/개발 기준 영역은 기존 runtime flag 기준을 유지한다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-single-analysis-0.9.2217.md

삭제 파일 목록 :
없음
