Version :
0.9.22438

Summary :
시스템관리자 실제 삭제 흐름 보정

Description :
시스템관리자 저장소 실제 삭제에서 작업지시서 후보의 R2 묶음 파일 삭제가 실패했는데도 작업지시서와 메모가 삭제 완료로 처리될 수 있는 순서를 보정했다. R2 삭제가 먼저 성공한 경우에만 작업지시서와 묶음 메모, 첨부 휴지통 항목을 purged 처리하고, 실패 시 retry 가능한 failed 후보로 유지하도록 정리했다.

수정 파일 목록 :
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-purge-flow-0.9.22438.md

삭제 파일 목록 :
없음
