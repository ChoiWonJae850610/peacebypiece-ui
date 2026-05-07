Version :
0.9.22376

Summary :
시스템관리자 실제 삭제 후보 pending 노출 보정

Description :
시스템관리자 저장소 실제 삭제 후보 목록에서 고객관리자가 아직 영구삭제 요청하지 않은 복구 가능 pending 작업지시서가 보이지 않도록 수정했다. 실제 삭제 후보는 영구삭제 요청, 보관 기간 도래, 실패 항목만 표시하도록 정리했다.

수정 파일 목록 :
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-purge-candidate-pending-hide-0.9.22376.md

삭제 파일 목록 :
없음
