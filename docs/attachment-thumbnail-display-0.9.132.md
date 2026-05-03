# 첨부 썸네일 표시 연결 점검 — 0.9.132

## 목적

0.9.131에서 썸네일 URL helper를 보완했지만, 실제 작업지시서 디자인/첨부 카드가 원본 이미지를 계속 요청하는 현상이 확인되었다.

0.9.132에서는 DB/API 응답에 `thumbnail_key` 같은 snake_case 필드가 남아 있어도 카드 표시 URL 생성 로직이 썸네일 key를 읽을 수 있도록 보완한다.

## 현재 확인된 상태

- 원본 업로드: 정상
- 썸네일 R2 저장: 정상
- DB `attachments.thumbnail_key`: 값 있음
- DB `thumbnail_url`, `preview_url`: 값 없음
- 카드 표시: 원본 key 요청 확인
- 미리보기/다운로드/삭제: 정상

## 적용 원칙

### 카드/목록 표시

우선순위:

1. `thumbnailUrl`
2. `thumbnail_url`
3. `thumbnailKey`
4. `thumbnail_key`
5. 원본 preview/url fallback

`thumbnailKey` 또는 `thumbnail_key`가 있으면 기존 file proxy API로 표시 URL을 만든다.

```text
/api/workorders/attachments/file?key={thumbnail_key}
```

### 미리보기

미리보기는 원본 파일을 유지한다.

우선순위:

1. `previewUrl`
2. `preview_url`
3. `url`

### 다운로드

다운로드는 원본 storage key를 유지한다.

우선순위:

1. `storageKey`
2. `storage_key`
3. 기존 file route url
4. 직접 URL

## 이번 버전 수정 범위

- `lib/permissions/attachments.ts`
  - camelCase 필드와 snake_case 필드를 모두 읽도록 보완
  - 카드 표시용 썸네일 URL 생성에서 `thumbnail_key` fallback 추가
  - 다운로드 URL 생성에서 `storage_key` fallback 추가

## 이번 버전에서 하지 않은 것

- DB schema 변경
- upload/complete API 응답 포맷 변경
- Worker 변경
- R2 직접 SDK 업로드/삭제 재도입
- 대표 이미지 자동 지정/삭제 후 승계 로직 적용

## 확인 방법

1. 작업지시서 화면에서 개발자도구 Network를 연다.
2. 이미지 첨부가 있는 작지를 F5 새로고침한다.
3. 카드 이미지 요청 URL을 확인한다.
4. 정상이라면 카드 표시 요청에 아래 경로가 포함되어야 한다.

```text
workorders/{workOrderId}/thumbnails/design/{fileId}.webp
```

5. 첨부 클릭 미리보기와 다운로드는 원본 경로를 유지해야 한다.

```text
workorders/{workOrderId}/design/{fileId}.jpg
```

## 다음 후보

0.9.133에서 대표 이미지 자동 지정/삭제 후 승계 로직을 별도로 적용한다.
