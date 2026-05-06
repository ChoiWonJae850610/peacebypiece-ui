Version :
0.9.213

Summary :
통계 성능 측정 기준 문서화

Description :
작업지시서 목록, 작업지시서 상세 hydrate, 통계 overview 집계, 차트 렌더링, API 에러율, R2 upload/purge 실패율의 성능 목표와 측정 위치를 정리했다. 고객관리자 통계 화면에는 성능 측정 기준 카드를 추가하고, 관련 기준을 stats performance policy 상수로 분리했다. DB schema, package 의존성, API route는 변경하지 않았다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/stats/index.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/stats-performance-baseline-0.9.213.md
- lib/admin/stats/performancePolicy.ts

삭제 파일 목록 :
없음
