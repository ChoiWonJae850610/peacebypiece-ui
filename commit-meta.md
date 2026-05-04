Version :
0.9.167

Summary :
작업지시서 종속 첨부의 개별 영구삭제 방지

Description :
삭제된 작업지시서에 연결된 첨부파일은 개별 복원뿐 아니라 개별 영구삭제 요청과 purge 후보에서도 제외되도록 보완했다. 작업지시서 종속 첨부는 작업지시서 묶음 복원/삭제 정책을 따르도록 휴지통 UI, 클라이언트 액션, DB 조회 조건을 함께 정리했다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- components/admin/files/WorkOrderStorageSection.tsx
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/adminFiles.serverActions.ts
- lib/admin/adminFiles.types.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
