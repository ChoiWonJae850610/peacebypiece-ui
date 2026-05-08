Version :
0.9.22399

Summary :
삭제 상태 DB 메타데이터 구조화 1차 적용

Description :
delete_reason 문장 기반 판정을 바로 제거하지 않고 legacy fallback으로 유지하면서 delete_source, delete_scope, delete_parent_type, delete_parent_id, delete_batch_id 기준의 구조화된 삭제 상태 컬럼을 추가했다. 작업지시서 묶음 삭제와 개별 첨부 삭제 저장 흐름에 구조화 메타데이터를 기록하도록 보정하고, 고객관리자/시스템관리자 저장소 후보 판정은 신규 delete_source 기준을 우선 사용하도록 수정했다. full_reset, smoke test, migration SQL과 적용 문서도 함께 추가했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/spec_sheets.sql
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/admin/files/trashPolicy.ts
- lib/constants/app.ts
- lib/system/storagePurgeCandidates.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
- db/schema/patch_0_9_22399_delete_state_metadata.sql
- docs/storage-delete-state-schema-apply-0.9.22399.md

삭제 파일 목록 :
없음
