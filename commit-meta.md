Version :
0.9.224371

Summary :
작업지시서 복원 시 단독 삭제 메모 복원 방지

Description :
작업지시서 복원 시 삭제 시각 근접 조건으로 단독 삭제 메모까지 복원되던 문제를 수정했다. 휴지통과 시스템관리자 실제 삭제 후보의 메모 개수도 작업지시서 묶음 삭제 메타데이터가 있는 메모만 카운트하도록 보정했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-workorder-memo-bundle-restore-0.9.224371.md

삭제 파일 목록 :
없음
