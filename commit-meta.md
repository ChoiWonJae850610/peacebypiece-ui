Version :
0.9.22432

Summary :
관리자 통계 TOP5 데이터 기준 정교화

Description :
기간 요약 클릭에 따라 표시되는 완료 작업지시서, 리오더, 불량 작업지시서 TOP5의 집계 기준을 분리하고 화면에 기준 설명을 추가했다. 리오더는 2차 이상 또는 부모 작업지시서가 있는 항목 중 재작업이 아닌 작업지시서로 집계하고, 불량 작업지시서는 현재 DB 기준에서 rejected, is_rework, rework 작업 유형을 기준으로 집계하도록 정리했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminStats.repository.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-stats-top5-basis-0.9.22432.md

삭제 파일 목록 :
없음
