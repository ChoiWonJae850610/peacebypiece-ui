# 0.9.22341 — 저장소 휴지통 preview 빌드/런타임 오류 수정

## 목적

0.9.2234에서 휴지통 R2 preview URL을 연결하면서 발생한 빌드 오류와 런타임 오류를 최소 수정한다.

## 수정 내용

- `AdminTrashFileItem` placeholder에 `thumbnailUrl`, `previewUrl` 기본값을 추가한다.
- `adminFiles.serverActions.ts`에서 누락된 `createAttachmentFilePreviewUrl` helper를 추가한다.
- helper는 storage key를 `/api/workorders/attachments/file?key=...` proxy URL로 변환한다.
- 휴지통 상세 모달의 정보 카드 텍스트 굵기를 낮춰 화면 압박감을 줄인다.

## 변경하지 않은 것

- DB schema 변경 없음
- package.json/package-lock.json 변경 없음
- R2 Worker 정책 변경 없음
