Version :
0.13.68

Summary :
작업지시서 R2 legacy key 호환 제거

Description :
작업지시서 첨부와 썸네일 R2 key 검증에서 기존 workorders/{workOrderId} 경로 호환을 제거하고 companies/{companyId}/workorders 경로만 허용하도록 보정했다. Worker 파일 정책에서도 legacy workorders 경로 허용을 제거했다.

수정 파일 목록 :
- cloudflare/r2-upload-worker.js
- lib/storage/r2/r2Keys.ts
- lib/storage/r2/r2ThumbnailKeys.ts
- lib/workorder/attachments/attachmentFileRoute.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
