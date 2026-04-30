Version: 0.9.19

Summary: 첨부 이미지 썸네일 저장 구조 적용

Description:
- 이미지 첨부 업로드 시 원본과 별도 썸네일 R2 key를 생성하도록 정리했습니다.
- 브라우저에서 360px 기준 WEBP 썸네일 파일을 생성해 별도 업로드 대상으로 전송하도록 추가했습니다.
- DB attachments.thumbnail_key 저장 및 조회 매핑을 연결했습니다.
- 목록/패널에서는 thumbnailUrl을 우선 사용하고, 원본 previewUrl과 분리되도록 유지했습니다.
- Worker 및 파일 프록시의 허용 key 정책에 thumbnails 경로를 추가했습니다.
- lib/constants/app.ts는 APP_VERSION만 0.9.19로 변경했고 나머지 export는 유지했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION 0.9.19 반영
- lib/storage/r2/r2Keys.ts: thumbnail R2 key 허용 정책 추가
- lib/workorder/attachments/attachmentUploadApiClient.ts: 원본/썸네일 업로드 흐름 분리
- lib/workorder/persistence/dbAttachmentMemoRepository.ts: thumbnail_key 저장 및 조회 매핑 연결
- app/api/workorders/attachments/upload/route.ts: 이미지 파일용 thumbnail upload target 생성
- app/api/workorders/attachments/upload/complete/route.ts: thumbnailStorageKey 검증 및 응답 매핑
- cloudflare/r2-upload-worker.js: thumbnails 경로 PUT/GET/DELETE 허용

추가 파일 목록:
- lib/storage/r2/r2ThumbnailKeys.ts: thumbnail key 생성/검증 유틸 추가
- lib/workorder/attachments/attachmentThumbnails.ts: 브라우저 썸네일 생성 유틸 추가

삭제 파일 목록:
- 없음

작업 상세 내용:
- 이미지 첨부만 thumbnailStorageKey를 생성합니다.
- PDF와 일반 파일은 기존 previewUrl 흐름을 유지합니다.
- 썸네일 파일은 image/webp로 생성됩니다.
- 기존 storage_key는 원본용으로 유지됩니다.
- thumbnail_key가 있으면 thumbnailUrl은 /api/workorders/attachments/file?key=... 프록시 URL로 반환됩니다.
