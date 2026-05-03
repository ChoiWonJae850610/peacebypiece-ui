Version :
0.9.130

Summary :
첨부 썸네일 Worker 업로드 실패 안전화와 대표 이미지 규칙 문서화

Description :
원본 첨부 업로드 성공 흐름은 유지하면서 썸네일 업로드 실패 로그가 Error stack으로 과도하게 출력되지 않도록 정리했다. Worker는 썸네일 key를 명시적으로 허용하고 배포 버전 확인용 헤더를 포함하도록 보완했다. 대표 이미지 자동 지정과 삭제 후 승계 로직은 이번 버전에서 문서화만 하고 코드 적용은 다음 버전으로 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/attachments/attachmentUploadApiClient.ts
- cloudflare/r2-upload-worker.js
- docs/restore-baseline-0.9.121.md
- docs/attachment-memo-r2-audit-0.9.123.md

추가 파일 목록 :
- docs/attachment-primary-thumbnail-rules-0.9.130.md

삭제 파일 목록 :
없음
