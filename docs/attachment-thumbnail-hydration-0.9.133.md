# 0.9.133 첨부 썸네일 hydrate 연결 점검

## 목적

0.9.130 이후 썸네일 파일은 R2에 생성되고 `attachments.thumbnail_key`에도 값이 저장된다. 그러나 작업지시서 화면을 새로고침하면 카드 이미지가 여전히 원본 `workorders/.../design/...` 경로를 요청했다.

0.9.133에서는 DB snapshot 조회 결과에 `thumbnail_key`가 포함되도록 보완하여, 작업지시서 API 응답과 프론트 attachment 객체까지 썸네일 key가 전달되도록 한다.

## 원인

`dbAttachmentMemoRepository.listSnapshotByWorkOrderId`의 attachments 조회 SELECT 목록에 `thumbnail_key`가 빠져 있었다.

결과적으로:

1. DB에는 `thumbnail_key`가 저장됨
2. R2에도 썸네일 webp 객체가 존재함
3. 하지만 작업지시서 hydrate 시 attachment 객체의 `thumbnailKey`가 null 처리됨
4. 카드 표시 URL helper가 썸네일을 선택할 수 없음
5. 화면은 기존 원본 `storage_key` 기반 URL을 사용함

## 수정 내용

- `attachments` snapshot SELECT 목록에 `thumbnail_key` 추가
- 기존 `mapAttachmentRow`의 `thumbnailKey`/`thumbnailUrl` 매핑을 그대로 활용
- 카드/목록 표시 URL은 기존 helper 정책대로 썸네일을 우선 사용
- 미리보기/다운로드는 기존 원본 `storage_key` 기준 유지

## 변경하지 않은 것

- DB schema 변경 없음
- Worker 업로드/삭제 흐름 변경 없음
- 원본 미리보기/다운로드 정책 변경 없음
- 대표 이미지 자동 지정/삭제 후 승계 로직 적용 없음

## 적용 후 확인 방법

1. `npm run build`
2. 작업지시서 화면에서 이미지 첨부가 있는 작지를 연다.
3. 개발자도구 Network를 켜고 F5 새로고침한다.
4. 카드 이미지 요청 URL에 아래 경로가 포함되는지 확인한다.

```text
workorders/{workOrderId}/thumbnails/design/{fileId}.webp
```

5. 첨부 클릭 미리보기와 다운로드는 원본 `workorders/{workOrderId}/design/...` 경로를 유지하는지 확인한다.

## 다음 보류 항목

대표 이미지 관련 미세 로직은 별도 버전에서 처리한다.

- 최초 디자인 첨부 업로드 시 자동 대표 지정
- 대표 이미지 삭제 시 남은 디자인 첨부 자동 대표 승계
- 대표 이미지는 작업지시서별 design 이미지 기준 1개만 유지
