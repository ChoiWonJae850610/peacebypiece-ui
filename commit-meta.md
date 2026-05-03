Version :
0.9.124

Summary :
첨부 다운로드 URL 생성 로직 안정화

Description :
0.9.77 복구 라인의 기존 UI를 유지하면서 첨부 다운로드 URL 생성 로직만 최소 보완했다. storageKey가 있는 DB 첨부는 기존 file API 다운로드 경로를 사용하고, storageKey 없이 data/blob/http URL만 가진 mock/sample/임시 첨부는 R2 storage key로 오인하지 않도록 직접 URL을 유지한다. 복구 기준 문서와 R2 첨부 점검 문서에 0.9.124 반영 내용을 기록했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/permissions/attachments.ts
- docs/restore-baseline-0.9.121.md
- docs/attachment-memo-r2-audit-0.9.123.md

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
