Version :
0.9.22417

Summary :
저장소 휴지통 삭제일시 시간대 기준 보정

Description :
작업지시서 삭제일시와 문서/디자인 휴지통 삭제일시가 서로 다른 시간처럼 표시되는 문제를 보정했다. spec_sheets.deleted_at을 timestamptz 기준으로 정리하고, 저장소관리 날짜 표시를 Asia/Seoul 기준 formatter로 중앙화했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/spec_sheets.sql
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts
- lib/system/storagePurgeCandidates.ts

추가 파일 목록 :
- db/schema/patch_0_9_22417_spec_sheets_deleted_at_timestamptz.sql
- docs/storage-trash-deleted-at-timezone-0.9.22417.md
- lib/admin/adminFiles.datePresentation.ts

삭제 파일 목록 :
없음
