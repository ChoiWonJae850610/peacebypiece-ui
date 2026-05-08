Version :
0.9.22403

Summary :
작업지시서 휴지통 삭제 메타데이터 판정 보정

Description :
작업지시서 삭제/복원/삭제 요청 흐름에서 문서/디자인/메모 묶음 항목을 delete_reason 문장 비교보다 구조화된 삭제 메타데이터 기준으로 우선 판정하도록 보정했다. 작업지시서 묶음 SQL predicate를 공통 정책 함수로 분리하고, 시스템관리자 실제 삭제 후보 판정도 같은 기준을 사용하도록 정리했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/admin/files/trashPolicy.ts
- lib/system/storagePurgeCandidates.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-trash-policy-metadata-0.9.22403.md

삭제 파일 목록 :
없음
