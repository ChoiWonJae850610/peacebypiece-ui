Version :
0.9.22380

Summary :
저장소 휴지통 정책 상수화 리팩토링

Description :
작업지시서 삭제 묶음 판단에 사용하던 delete_reason 문장 하드코딩을 저장소 휴지통 정책 상수로 분리했다. 관리자 저장소, 시스템관리자 실제 삭제 후보, 작업지시서 삭제 저장 로직이 같은 정책 값을 참조하도록 정리하고, 기존 queryDb 인자 중복 전달도 함께 보정했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/system/storagePurgeCandidates.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/admin/files/trashPolicy.ts
- docs/storage-refactor-trash-policy-0.9.22380.md

삭제 파일 목록 :
없음
