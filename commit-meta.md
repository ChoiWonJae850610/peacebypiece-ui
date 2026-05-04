Version :
0.9.168

Summary :
저장소 휴지통 복구정책 표시와 작업지시서 목록 정보를 보정

Description :
휴지통 첨부파일의 복구정책을 파일 단위 처리 가능, 작업지시서 삭제로 복원 불가, 묶음 처리 필요로 분리했다. 작업지시서 삭제 전에 개별 삭제된 파일은 복원만 막고 영구삭제는 허용하며, 작업지시서 삭제와 함께 삭제된 파일만 개별 복원과 개별 영구삭제를 모두 막도록 보정했다. 영구삭제 요청 상태 파일은 고객관리자 휴지통 목록에서 제외되도록 정리했고, 작업지시서 저장소 목록에는 한글 상태명, 삭제일시, 설명형 첨부/메모 수량을 표시한다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
