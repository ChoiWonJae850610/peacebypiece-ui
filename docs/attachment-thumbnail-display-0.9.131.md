# 0.9.131 첨부 썸네일 표시 적용 기준

## 목적

0.9.130까지는 이미지 첨부 업로드 시 썸네일 webp가 R2에 생성되고 `attachments.thumbnail_key`에도 저장되지만, 작업지시서 카드/목록 화면에서는 원본 이미지가 표시용으로 사용될 수 있었다.

0.9.131에서는 첨부 카드/목록 표시 URL 선택 기준을 보완한다.

## 적용 원칙

- 카드/목록 표시용 이미지는 `thumbnailUrl`을 우선 사용한다.
- `thumbnailUrl`이 비어 있고 `thumbnailKey`가 있으면 기존 file proxy API로 썸네일 표시 URL을 생성한다.
- `thumbnailKey`도 없으면 기존 `previewUrl` 또는 `url`을 사용한다.
- 확대 미리보기와 다운로드는 기존 원본 URL/원본 storage key 기준을 유지한다.
- DB schema는 변경하지 않는다.
- R2 직접 SDK 업로드/삭제 fallback은 재도입하지 않는다.

## 기대 동작

작업지시서 첨부 카드에서 이미지가 표시될 때 다음 우선순위를 따른다.

1. `attachment.thumbnailUrl`
2. `attachment.thumbnailKey` 기반 `/api/workorders/attachments/file?key=...`
3. `attachment.previewUrl`
4. `attachment.url`

## 테스트 방법

1. 이미지 첨부를 업로드한다.
2. Neon `attachments.thumbnail_key`에 값이 들어갔는지 확인한다.
3. 작업지시서 화면에서 개발자도구 Network를 연다.
4. F5 새로고침 후 첨부 카드 이미지 요청 URL을 확인한다.
5. 카드 표시용 요청에 `workorders/{workOrderId}/thumbnails/...webp` key가 사용되면 정상이다.
6. 첨부 클릭 미리보기와 다운로드는 원본 파일 기준으로 동작해야 한다.

## 0.9.132 이후 분리 대상

아래 항목은 0.9.131에서 적용하지 않는다.

- 디자인 첨부 최초 업로드 시 자동 대표 지정
- 대표 이미지 삭제 시 남은 디자인 첨부 자동 승계
- 대표 이미지를 workorder/design 첨부 기준 1개로 강제 정리
- 썸네일/원본 용량 집계 정책 반영
