Version :
0.9.22406

Summary :
delete_reason DB 컬럼 제거와 삭제 상태 판정 단일화

Description :
개발 DB reset 전제를 기준으로 attachments와 attachment_trash_items의 delete_reason 컬럼 의존을 제거했다. 첨부 삭제 API, repository, 관리자 저장소 조회/복원 로직에서 deleteReason 입력과 delete_reason select/update/mapping을 제거하고, 삭제 상태 판정은 delete_source/delete_scope/delete_parent_type/delete_parent_id/delete_batch_id 구조화 메타데이터 기준으로 단일화했다. full_reset, seed SQL, smoke test, migration SQL도 함께 보정했다.

수정 파일 목록 :
- app/api/workorders/attachments/delete/route.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/seed_realistic_workorders_0_9_2227.sql
- db/schema/seed_stats_demo_0_9_2071.sql
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/workorder/attachments/attachmentDeleteApiClient.ts
- lib/workorder/persistence/attachmentMemoRepository.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
- db/schema/patch_0_9_22406_remove_delete_reason.sql
- docs/storage-delete-reason-schema-removal-0.9.22406.md
- commit-meta.md

삭제 파일 목록 :
없음
