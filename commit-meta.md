Version :
0.9.125

Summary :
메모 저장과 상태전환 후 유지 문제 보완

Description :
작업지시서 상태 변경 저장 과정에서 memoThreads 전체를 삭제 후 재삽입하지 않도록 변경해, 별도 메모 API로 저장된 DB 메모가 검토완료 등 상태 변경 시 사라지는 문제를 보완했다. 기존 replace helper에는 company_id와 company_name을 포함해 memos 테이블 not-null 제약 위반 가능성을 줄였다. R2는 Worker 기반 처리 흐름을 유지하고, 첨부 UI와 Worker 파일은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- docs/restore-baseline-0.9.121.md
- docs/attachment-memo-r2-audit-0.9.123.md

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
