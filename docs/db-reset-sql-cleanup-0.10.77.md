# PeaceByPiece 0.10.77 DB reset SQL 정리

## 목적

> 0.10.78 보완: 0.10.77에서 보류했던 `patch_0_9_43_admin_stats_events.sql`과 잔여 모듈형 schema/데모 seed 파일은 최종 삭제 대상으로 확정했다. 현재 reset 기준은 `full_reset.sql` + `db/seed/system_standards_seed.sql` + `full_reset_smoke_test.sql`이다.


`full_reset.sql` 한 번으로 현재 개발 기준 schema가 만들어지도록 0.10.52 초대/가입/승인/권한 schema와 0.10.76 초대 실제 생성 보강을 baseline에 통합했다.

## 실제 반영 여부 판단

| 파일 | full_reset 반영 상태 | 판단 |
| --- | --- | --- |
| patch_0_6_631_attachment_trash_restore_purge.sql | attachments / attachment_trash_items / purge 관련 컬럼이 full_reset에 존재 | 삭제 가능 |
| patch_0_6_632_admin_file_snapshot_and_purge_candidates.sql | attachment_trash_items purge/list index가 full_reset에 존재 | 삭제 가능 |
| patch_0_6_633_attachment_purge_worker.sql | purge retry/error 컬럼이 full_reset에 존재 | 삭제 가능 |
| patch_0_6_634_attachment_purge_worker_qa.sql | purge_requested 상태 기준과 unique index가 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6360_company_settings.sql | company_settings 테이블이 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6377_units_company_id.sql | units.company_id와 고객사별 unit 구조가 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6380_standards_units_item_categories.sql | units/item_categories 고객사 기준 구조가 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6392_history_logs.sql | history_logs 테이블이 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6396_admin_db_structure.sql | users/company_id/history/attachment 기준이 full_reset에 존재 | 삭제 가능 |
| patch_0_6_6397_company_scope.sql | company_id 전면 적용 기준과 샘플 고객사가 full_reset에 존재 | 삭제 가능 |
| patch_0_7_3_user_access_test_structure.sql | 초기 테스트용 사용자/권한 구조이며 현재 full_reset의 user/permission 구조가 상위 | 삭제 가능 |
| patch_0_8_0_user_permission_db_structure.sql | 초기 권한 구조이며 현재 full_reset + 0.10.52 통합 구조가 상위 | 삭제 가능 |
| patch_0_9_43_admin_stats_events.sql | 현재 코드 기준 직접 사용 흐름이 없고 통계는 summary table 중심으로 전환됨 | 0.10.78에서 삭제 가능 |
| patch_0_9_57_tenant_user_permission.sql | companies/users/permissions/plan 기초 구조가 full_reset에 존재 | 삭제 가능 |
| patch_0_9_60_invitations.sql | invitations 테이블과 token_hash 기준이 full_reset에 존재 | 삭제 가능 |
| patch_0_9_66_plan_storage.sql | plans/company_plan_assignments/storage_usage_snapshots가 full_reset에 존재 | 삭제 가능 |
| patch_0_9_203_stats_schema.sql | company_workorder_daily/monthly, company_storage_daily stats 테이블이 full_reset에 존재 | 삭제 가능 |
| patch_0_9_22399_delete_state_metadata.sql | delete_source/delete_scope/delete_parent/delete_batch 계열 컬럼이 full_reset에 존재 | 삭제 가능 |
| patch_0_9_22406_remove_delete_reason.sql | smoke test에서 delete_reason 부재를 검증하므로 full_reset에 반영 | 삭제 가능 |
| patch_0_9_22417_spec_sheets_deleted_at_timestamptz.sql | full_reset의 spec_sheets.deleted_at은 timestamptz 기준 | 삭제 가능 |
| patch_0_10_10_audit_logs.sql | audit_logs 테이블과 index가 full_reset에 존재 | 삭제 가능 |
| patch_0_10_38_system_standards_schema.sql | system standards 원장/고객사 연결 테이블이 full_reset에 존재 | 삭제 가능 |
| patch_0_10_48_system_standards_seed_refresh.sql | patch가 아니라 baseline seed 성격이므로 db/seed/system_standards_seed.sql로 이동 | 기존 파일 삭제 가능 |
| patch_0_10_52_invitation_membership_permission_schema.sql | 0.10.77에서 full_reset에 통합 | 삭제 가능 |
| patch_0_10_76_invitation_actual_create.sql | 0.10.77에서 full_reset에 통합 | 삭제 가능 |

## 0.10.78 추가 삭제 확정

아래 잔여 파일은 reset 기준에서 제외한다.

```text
db/schema/materials.sql
db/schema/orders.sql
db/schema/outsourcing.sql
db/schema/spec_sheets.sql
db/schema/patch_0_9_43_admin_stats_events.sql
db/schema/seed_realistic_category_depth_0_9_22271.sql
db/schema/seed_realistic_workorders_0_9_2227.sql
db/schema/seed_realistic_workorders_usage_0_9_224341.md
db/schema/seed_stats_demo_0_9_2071.sql
db/schema/tenant_user_permission_design.md
```

## seed 분리

`patch_0_10_48_system_standards_seed_refresh.sql`은 schema patch가 아니라 기준정보 baseline seed다. 새 경로는 아래다.

```text
db/seed/system_standards_seed.sql
```

## reset 실행 순서

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
```

`full_reset.sql`에 0.10.52와 0.10.76이 통합되었으므로 더 이상 아래 파일은 별도 실행하지 않는다.

```text
db/schema/patch_0_10_52_invitation_membership_permission_schema.sql
db/schema/patch_0_10_76_invitation_actual_create.sql
```
