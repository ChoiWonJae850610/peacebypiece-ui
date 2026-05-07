# 0.9.2234 — 저장소 휴지통 R2 preview 썸네일 1차 연결

## 목표

저장소 관리 휴지통 목록과 상세 모달에서 이미지 계열 파일을 실제 R2 preview route 기반 썸네일로 표시한다.

## 적용 범위

- `components/admin/files/FileTrashSection.tsx`
- `lib/admin/adminFiles.serverActions.ts`
- `lib/admin/adminFiles.types.ts`
- `lib/constants/app.ts`

## 변경 내용

1. `attachment_trash_items.storage_key`, `attachment_trash_items.thumbnail_key`를 휴지통 조회 결과에 포함한다.
2. storage key를 `/api/workorders/attachments/file?key=...` route URL로 변환한다.
3. `AdminTrashFileItem`에 `thumbnailUrl`, `previewUrl`을 추가한다.
4. 휴지통 목록에서 이미지 파일은 실제 thumbnail/preview URL을 우선 사용한다.
5. PDF/기타 파일과 작업지시서 항목은 기존 배지 방식을 유지한다.
6. 상세 모달에서 attachment 항목은 `파일 미리보기 열기` 링크를 제공한다.

## 보류 사항

- 별도 thumbnail cache 생성
- PDF 미리보기 썸네일 생성
- 이미지 로딩 실패 시 상태 저장
- 큰 이미지 preview modal

## 테스트

1. R2 small preset 업로드 후 `/admin/files` 접속
2. 휴지통 목록에서 이미지 파일이 작은 preview로 표시되는지 확인
3. PDF/기타 파일은 배지로 표시되는지 확인
4. 이미지 파일 row 클릭 후 상세 모달에서 같은 preview가 표시되는지 확인
5. `파일 미리보기 열기`가 새 탭으로 열리는지 확인
