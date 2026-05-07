# 저장소 삭제 요청 요약 검증 — 0.9.22374

## 목적

`/admin/files` 파일 운영 요약의 “삭제 요청” 항목이 작업지시서 개수가 아니라 `attachment_trash_items.purge_status = 'purge_requested'` 상태의 첨부파일 개수와 첨부파일 용량만 합산하는지 확인한다.

## 적용 기준

- 고객관리자 휴지통 목록은 복구 가능한 `pending` 항목 중심으로 유지한다.
- 고객관리자가 영구삭제 요청한 `purge_requested` 항목은 `/admin/files` 기본 휴지통 목록에서 숨긴다.
- 시스템관리자 `/system/storage-usage` 실제 삭제 후보에서는 작업지시서 후보 표시를 유지한다.
- 작업지시서 자체 개수는 `/admin/files` 파일 운영 요약의 “삭제 요청” 개수에 합산하지 않는다.

## 확인 쿼리

```sql
WITH purge_requested_attachments AS (
  SELECT DISTINCT ON (t.attachment_id)
         t.attachment_id,
         COALESCE(t.size_bytes, a.size_bytes, 0) AS size_bytes
    FROM attachment_trash_items t
    LEFT JOIN attachments a ON a.id = t.attachment_id
   WHERE t.purge_status = 'purge_requested'
     AND t.attachment_id IS NOT NULL
     AND t.restored_at IS NULL
     AND t.purged_at IS NULL
   ORDER BY t.attachment_id, COALESCE(t.purge_requested_at, t.updated_at, t.deleted_at) DESC
)
SELECT COUNT(*) AS file_count,
       COALESCE(SUM(size_bytes), 0) AS size_bytes
  FROM purge_requested_attachments;
```

## 화면 검증 항목

1. 작업지시서 1건에 연결된 첨부파일 2개를 휴지통 이동 후 영구삭제 요청한다.
2. `/admin/files` 상단 파일 운영 요약의 “삭제 요청” 값이 `2개`로 표시되는지 확인한다.
3. 같은 카드 설명의 용량이 위 쿼리의 `size_bytes` 합산값과 같은지 확인한다.
4. `/admin/files` 휴지통 목록에서 해당 `purge_requested` 파일들이 숨겨지는지 확인한다.
5. `/system/storage-usage` 실제 삭제 후보에서 작업지시서 후보가 계속 표시되는지 확인한다.

## 판정

이 버전의 snapshot API는 `attachment_trash_items`를 기준으로 `purge_requested` 첨부파일을 중복 제거한 뒤 개수와 용량을 집계한다. 따라서 작업지시서 삭제 요청 1건 안에 첨부파일 2개가 있으면 고객관리자 파일 운영 요약에는 삭제 요청 2개로 표시된다.
