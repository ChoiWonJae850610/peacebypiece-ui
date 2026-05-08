Version :
0.9.22381

Summary :
저장소 휴지통 상태 정책 리팩토링

Description :
저장소 휴지통과 시스템관리자 실제 삭제 후보에서 사용하던 purge 상태 문자열 판정을 중앙 정책 함수로 분리했다. 휴지통 상태 정규화, pending/requested 판정, 표시 상태 계산을 공통 함수로 정리하고 시스템관리자 실제 삭제 처리 actor id도 중앙 상수로 정리했다. 시스템관리자 삭제 후보 row의 중복 companyName 필드도 제거했다.

수정 파일 목록 :
- lib/admin/files/trashPolicy.ts
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-refactor-trash-status-policy-0.9.22381.md

삭제 파일 목록 :
없음
