Version :
0.10.77

Summary :
DB reset 기준과 오래된 patch SQL 정리

Description :
full_reset.sql에 0.10.52 초대/가입/승인/권한 schema와 0.10.76 초대 실제 생성 보강을 통합했다. full_reset_smoke_test.sql에 신규 멤버/권한/초대 검증을 추가하고, 시스템 기준정보 seed를 patch SQL이 아닌 db/seed/system_standards_seed.sql로 분리했다. full_reset에 이미 반영된 오래된 patch SQL 삭제 대상을 문서화했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
- db/seed/system_standards_seed.sql
- docs/db-reset-sql-cleanup-0.10.77.md

삭제 파일 목록 :
- db/schema/patch_0_6_631_attachment_trash_restore_purge.sql
- db/schema/patch_0_6_632_admin_file_snapshot_and_purge_candidates.sql
- db/schema/patch_0_6_633_attachment_purge_worker.sql
- db/schema/patch_0_6_634_attachment_purge_worker_qa.sql
- db/schema/patch_0_6_6360_company_settings.sql
- db/schema/patch_0_6_6377_units_company_id.sql
- db/schema/patch_0_6_6380_standards_units_item_categories.sql
- db/schema/patch_0_6_6392_history_logs.sql
- db/schema/patch_0_6_6396_admin_db_structure.sql
- db/schema/patch_0_6_6397_company_scope.sql
- db/schema/patch_0_7_3_user_access_test_structure.sql
- db/schema/patch_0_8_0_user_permission_db_structure.sql
- db/schema/patch_0_9_57_tenant_user_permission.sql
- db/schema/patch_0_9_60_invitations.sql
- db/schema/patch_0_9_66_plan_storage.sql
- db/schema/patch_0_9_203_stats_schema.sql
- db/schema/patch_0_9_22399_delete_state_metadata.sql
- db/schema/patch_0_9_22406_remove_delete_reason.sql
- db/schema/patch_0_9_22417_spec_sheets_deleted_at_timestamptz.sql
- db/schema/patch_0_10_10_audit_logs.sql
- db/schema/patch_0_10_38_system_standards_schema.sql
- db/schema/patch_0_10_48_system_standards_seed_refresh.sql
- db/schema/patch_0_10_52_invitation_membership_permission_schema.sql
- db/schema/patch_0_10_76_invitation_actual_create.sql
