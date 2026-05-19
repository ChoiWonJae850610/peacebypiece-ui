Version :
0.13.92

Summary :
R2 작업지시서 파일 key scope 검증 보강

Description :
작업지시서 첨부와 썸네일 R2 key를 companyId와 workOrderId 기준으로 파싱·검증하는 공통 함수를 추가했다. 고객사/시스템 실제 삭제 후보 처리에서 삭제 대상 R2 key가 해당 회사와 작업지시서 범위에 속하지 않으면 실제 Worker 삭제를 진행하지 않고 실패로 남기도록 보정했다. 기존 업로드, 미리보기, 온보딩, 작업지시서 UI 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/storage/r2/r2Keys.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.purgeWorker.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
