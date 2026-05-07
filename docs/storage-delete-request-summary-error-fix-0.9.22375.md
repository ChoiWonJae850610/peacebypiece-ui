# 0.9.22375 저장소 삭제 요청 요약 런타임 오류 수정

## 수정 배경

`/api/admin/files/snapshot` 호출 중 `attachment_trash_items`에 존재하지 않는 `purge_requested_at` 컬럼을 정렬식에서 참조해 런타임 오류가 발생했다.

## 수정 내용

삭제 요청 요약 집계의 중복 제거 정렬 기준을 실제 schema에 존재하는 `updated_at`, `deleted_at` 기준으로 변경했다.

```sql
ORDER BY t.attachment_id, COALESCE(t.updated_at, t.deleted_at) DESC
```

## 유지 정책

- `purge_requested` 상태의 첨부파일만 삭제 요청 요약에 합산한다.
- 작업지시서 자체 개수는 고객관리자 삭제 요청 요약에 합산하지 않는다.
- 고객관리자 휴지통 목록에서는 `purge_requested` 항목 숨김 정책을 유지한다.
- DB schema 변경은 하지 않는다.
