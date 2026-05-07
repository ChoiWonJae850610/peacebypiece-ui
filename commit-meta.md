Version :
0.9.22375

Summary :
저장소 삭제 요청 요약 런타임 오류 수정

Description :
관리자 저장소 snapshot API에서 존재하지 않는 attachment_trash_items.purge_requested_at 컬럼을 참조하던 정렬식을 실제 schema에 존재하는 updated_at, deleted_at 기준으로 수정했다. 삭제 요청 요약은 기존처럼 purge_requested 상태의 첨부파일 개수와 용량만 합산한다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-delete-request-summary-error-fix-0.9.22375.md

삭제 파일 목록 :
없음
