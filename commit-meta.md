Version :
0.9.207

Summary :
고급 통계 preview와 요금제 잠금 기준 추가

Description :
고객관리자 통계 화면에 고급 통계 preview 영역을 추가하고 생산품유형, 협력업체 성과, 리오더, 검수/불량 통계의 요금제 잠금 기준을 표시했다. feature key와 preview 카드 데이터는 별도 stats feature gate 파일로 분리했다. DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- lib/admin/stats/featureGate.ts
- docs/stats-advanced-preview-0.9.207.md

삭제 파일 목록 :
없음
