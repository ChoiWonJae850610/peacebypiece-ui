Version :
0.9.22378

Summary :
작업지시서 묶음 purge와 선삭제 첨부 휴지통 분리

Description :
작업지시서 삭제 전에 이미 개별 삭제되어 휴지통에 있던 첨부파일이 작업지시서 실제 삭제 후 고객관리자 휴지통에서 숨겨지는 문제를 보정했다. 작업지시서 대표 row의 첨부 개수와 용량은 작업지시서 삭제로 함께 휴지통 이동한 첨부만 기준으로 집계하고, 선삭제 첨부파일은 고객관리자 휴지통과 별도 파일 purge 후보 흐름에 남도록 수정했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-storage-purge-predeleted-attachment-0.9.22378.md

삭제 파일 목록 :
없음
