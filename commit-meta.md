Version :
0.9.126

Summary :
R2 첨부 업로드 경로를 Worker 기준으로 고정

Description :
첨부 업로드 클라이언트에서 Worker 업로드 실패 시 서버 direct upload fallback을 호출하지 않도록 변경했다. direct upload route는 R2 SDK 업로드를 수행하지 않고 410 응답만 반환하도록 비활성화했다. 기존 삭제 기능, 첨부 UI, DB schema, package 파일은 변경하지 않았다.

수정 파일 목록 :
- app/api/workorders/attachments/upload/direct/route.ts
- lib/workorder/attachments/attachmentUploadApiClient.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md
- docs/attachment-memo-r2-audit-0.9.123.md

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
