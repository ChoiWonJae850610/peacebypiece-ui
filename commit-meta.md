Version :
0.9.22382

Summary :
저장소 휴지통 SQL 상태 정책 리팩토링

Description :
저장소 휴지통과 시스템관리자 실제 삭제 후보 로직에서 반복되던 purge_status, delete_status, purge_status SQL 문자열을 중앙 정책 값으로 참조하도록 정리했다. DB schema와 R2 Worker 기반 삭제 흐름은 변경하지 않고, delete_reason 문장 컬럼은 기존 구조를 유지했다.

수정 파일 목록 :
- lib/admin/files/trashPolicy.ts
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-refactor-trash-sql-policy-0.9.22382.md

삭제 파일 목록 :
없음
