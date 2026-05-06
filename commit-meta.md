Version :
0.9.212

Summary :
통계 API 캐싱 정책과 TanStack Query 도입 기준 정리

Description :
통계 화면의 서버/클라이언트/export 캐싱 기준을 코드 상수와 문서로 정리했다. TanStack Query는 API route 분리 전까지 도입을 보류하고, 고객관리자 통계 화면에는 캐싱 정책 안내 카드를 추가했다. package.json과 package-lock.json은 변경하지 않았다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/stats/index.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/stats-cache-policy-0.9.212.md
- lib/admin/stats/cachePolicy.ts

삭제 파일 목록 :
없음
