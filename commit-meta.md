Version :
0.9.22405

Summary :
시스템 저장소 삭제 상태 런타임 오류와 build 타입 오류 보정

Description :
0.9.22404에서 delete_reason fallback을 제거한 뒤 남아 있던 deleteReason 인자와 deleteStateMetadata undefined 참조를 정리했다. 시스템관리자 /system/storage-usage 화면에서 attachmentTrashItems를 읽지 못해 발생하던 런타임 오류와 adminFiles.serverActions.ts의 build 타입 오류를 보정했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-usage-delete-state-runtime-fix-0.9.22405.md
- commit-meta.md

삭제 파일 목록 :
없음
