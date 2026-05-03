Version :
0.9.133

Summary :
첨부 썸네일 키 hydrate 누락 보완

Description :
작업지시서 첨부 snapshot 조회 시 attachments.thumbnail_key가 응답에 포함되지 않아 카드 표시에서 원본 이미지를 계속 사용하던 문제를 보완했다. DB에 저장된 thumbnail_key가 프론트 attachment 객체까지 전달되도록 조회 컬럼을 추가했으며, 원본 미리보기와 다운로드, Worker 기반 R2 처리 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/attachment-thumbnail-hydration-0.9.133.md

삭제 파일 목록 :
없음
