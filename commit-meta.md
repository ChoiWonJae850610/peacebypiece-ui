Version :
0.9.22390

Summary :
저장소 snapshot base_title 조회 오류 수정

Description :
관리자 저장소 snapshot API에서 실제 DB schema에 없는 spec_sheets.base_title 컬럼을 조회하던 오류를 수정했다. base_title 참조는 NULL alias로 보존하고 작업지시서명 표시는 title, reorder_round, work_order_kind, is_rework 조합으로 유지했다. ChatGPT 환경에서는 npm build를 실행하지 않고 로컬에서 확인하는 규칙도 문서화했다.

수정 파일 목록 :
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-snapshot-base-title-error-0.9.22390.md

삭제 파일 목록 :
없음
