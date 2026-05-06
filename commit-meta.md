Version :
0.9.208

Summary :
Standard/Growth 통계 preview 1차 연결

Description :
고객관리자 통계 화면의 고급 통계 preview를 실제 DB 집계값과 연결했다. 생산품유형 TOP, 협력업체 성과, 리오더 preview는 기존 통계 snapshot의 집계 데이터를 사용하고, 검수/불량 위험은 데이터 구조 확정 전 준비 상태로 유지했다. 생산 단계 도넛 차트의 좁은 카드 범례 겹침은 compact layout으로 최소 보완했다.

수정 파일 목록 :
- components/admin/dashboard/AdminBasicStatsCharts.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/stats/featureGate.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/stats-standard-growth-0.9.208.md

삭제 파일 목록 :
없음
