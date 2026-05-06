Version :
0.9.221

Summary :
관리자 통계 화면 정보 구조 재정리

Description :
관리자 통계 화면의 정보 위계를 핵심 KPI, Basic 통계, 요금제별 preview, 운영 기준 접힘 영역 순서로 재정리했다. Basic/Standard/Growth/Premium 보기 버튼을 추가하고, 캐싱 정책과 summary table 검토 및 성능 기준은 하단 접힘 영역으로 이동했다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-layout-0.9.221.md

삭제 파일 목록 :
없음
