Version :
0.9.214

Summary :
summary table과 materialized view 검토 기준 정리

Description :
통계 성능 개선을 위해 summary table과 materialized view를 언제 도입할지 판단 기준을 정리했다. 고객관리자 통계 화면에 aggregate 전략 검토 섹션을 추가하고, 작업지시서 overview, 저장소 사용량, 협력업체/공장 성과, 검수/불량 위험, 시스템 고객사 사용량별 적용 후보와 보류 기준을 표시했다. 이번 버전은 DB schema, package 의존성, API route를 변경하지 않는다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/stats/index.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/stats-aggregate-readiness-0.9.214.md
- lib/admin/stats/aggregateReadinessPolicy.ts

삭제 파일 목록 :
없음
