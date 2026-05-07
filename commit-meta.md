Version : 0.9.22271
Summary : 생산품 유형 통계 분류 depth 기준 수정
Description : 통계정보 화면의 생산품 유형 비율에서 1차/2차/3차를 리오더 차수로 해석하던 구조를 대분류/중분류/세분류 기준으로 수정했다. 도넛 그래프와 TOP5는 category1_id/category2_id/category3_id 기준으로 집계되며, 기존 realistic seed에는 category depth label을 보강했다. 기존 DB에 바로 실행 가능한 보정 SQL도 추가했다.
수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- db/schema/seed_realistic_workorders_0_9_2227.sql
- lib/admin/adminStats.repository.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
추가 파일 목록 :
- db/schema/seed_realistic_category_depth_0_9_22271.sql
- docs/stats-category-depth-0.9.22271.md
삭제 파일 목록 :
- 없음
