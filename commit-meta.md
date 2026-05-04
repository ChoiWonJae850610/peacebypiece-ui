Version :
0.9.166

Summary :
작업지시서 휴지통 복원 충돌 방어 보완

Description :
고객관리자 저장소 휴지통에서 삭제된 작업지시서에 연결된 첨부파일이 개별 복구되지 않도록 UI와 기존 복구 흐름에 방어 조건을 추가했다. 작업지시서 탭에는 묶음 복원 정책 안내를 보강하고, 복원 방어 기준 문서를 추가했다. 작업지시서 복원 API, DB schema, R2 삭제 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-restore-guard-0.9.166.md

삭제 파일 목록 :
없음
