Version :
0.9.180

Summary :
작업지시서 영구삭제 상태 컬럼과 휴지통 제외 기준 추가

Description :
작업지시서와 메모를 Neon에서 즉시 hard delete하지 않고 영구삭제 완료 상태로 관리할 수 있도록 spec_sheets와 memos에 삭제/purge 상태 컬럼을 추가했다. 작업지시서 삭제/복구 흐름에서 해당 상태를 갱신하고, 영구삭제 완료 상태의 작업지시서와 종속 첨부가 고객관리자 휴지통 및 시스템 purge 후보에 노출되지 않도록 조회 기준을 보완했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/spec_sheets.sql
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-purge-state-0.9.180.md

삭제 파일 목록 :
없음
