Version :
0.9.181

Summary :
작업지시서 영구삭제 완료 상태를 실제 연결

Description :
통합 휴지통에서 작업지시서 영구삭제 실행 시 Neon row를 hard delete하지 않고 delete_status와 purge_status를 완료 상태로 전환하도록 연결했다. 작업지시서에 종속된 첨부 trash item은 Worker 기반 purge 대상으로 넘기기 위해 purge_requested 상태로 전환하고, 고객관리자 휴지통에서는 제외되도록 유지했다. 개별 첨부 복구/영구삭제와 작업지시서 복구 흐름은 유지했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- app/api/admin/files/workorders/purge/route.ts
- components/admin/files/FileTrashSection.tsx
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
