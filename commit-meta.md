Version :
0.9.22402

Summary :
저장소 휴지통 선택 흐름과 공통 정책 함수 보정

Description :
저장소 관리 휴지통에서 작업지시서 묶음 첨부가 파일 단독 실패 항목으로 잘못 집계되지 않도록 선택 대상 계산을 보정했다. 복원/삭제 요청 가능 여부 판정을 trashPolicy 공통 함수로 이동하고, 일부 actionFlow 결과 메시지 생성을 presentation formatter로 분리했다.

수정 파일 목록 :
- components/admin/files/fileTrashSectionActions.ts
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/files/trashPolicy.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-flow-common-policy-0.9.22402.md

삭제 파일 목록 :
없음
