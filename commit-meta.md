Version :
0.10.78

Summary :
DB schema 잔여 파일 정리와 reset 기준 최종화

Description :
full_reset 기준에서 제외되는 모듈형 schema 파일, 구버전 통계 patch, 데모 seed SQL, 구버전 권한 설계 문서를 삭제 대상으로 확정했다. 통계 화면의 reset 안내를 최신 full_reset, system standards seed, smoke test 순서로 보정하고 DB reset 정리 문서에 0.10.78 최종 삭제 기준을 반영했다.

수정 파일 목록 :
- components/admin/dashboard/AdminStatsDashboard.tsx
- docs/db-reset-sql-cleanup-0.10.77.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/db-schema-residual-cleanup-0.10.78.md

삭제 파일 목록 :
- db/schema/materials.sql
- db/schema/orders.sql
- db/schema/outsourcing.sql
- db/schema/spec_sheets.sql
- db/schema/patch_0_9_43_admin_stats_events.sql
- db/schema/seed_realistic_category_depth_0_9_22271.sql
- db/schema/seed_realistic_workorders_0_9_2227.sql
- db/schema/seed_realistic_workorders_usage_0_9_224341.md
- db/schema/seed_stats_demo_0_9_2071.sql
- db/schema/tenant_user_permission_design.md
