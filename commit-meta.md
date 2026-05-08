Version :
0.9.22383

Summary :
저장소 휴지통 서버 로직 상태 비교 정리

Description :
고객관리자 휴지통 작업지시서 조회 조건에 남아 있던 delete_status와 purge_status 문자열 직접 비교를 중앙 정책 SQL 목록으로 대체했다. 시스템관리자 작업지시서 묶음 R2 삭제 실패 집계가 중복 증가하던 부분도 보정했다.

수정 파일 목록 :
- lib/admin/files/trashPolicy.ts
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-refactor-trash-server-logic-0.9.22383.md

삭제 파일 목록 :
없음
