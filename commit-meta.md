Version :
0.9.22404

Summary :
delete_reason fallback 제거와 삭제 상태 판정 단일화

Description :
작업지시서 묶음 삭제 판정에서 delete_reason 문장 비교 fallback을 제거하고 delete_source/delete_scope/delete_parent_type/delete_parent_id 기반 구조화 메타데이터 판정으로 단일화했다. 시스템관리자 실제 삭제 후보와 고객관리자 휴지통 흐름도 같은 구조화 판정 기준을 사용하도록 정리했다.

수정 파일 목록 :
- components/admin/files/fileTrashSectionModals.tsx
- lib/admin/adminFiles.serverActions.ts
- lib/admin/files/trashPolicy.ts
- lib/system/storagePurgeCandidates.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-delete-reason-fallback-removal-0.9.22404.md

삭제 파일 목록 :
없음
