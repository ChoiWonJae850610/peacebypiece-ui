# storage usage DB 집계 연결 1차

Version: 0.9.89

## 목적

첨부파일 metadata 기준으로 고객사별 저장공간 사용량을 계산하고 `storage_usage_snapshots`에 저장할 수 있게 연결한다.

## API

### GET /api/system/storage-usage?companyId=company-sample-customer

우선 `latest_storage_usage_snapshots` view에서 최신 snapshot을 조회한다.  
snapshot이 없으면 `attachments` metadata 기준 live aggregate를 반환한다.

### POST /api/system/storage-usage?companyId=company-sample-customer&mode=attachment-metadata

`attachments` 테이블 기준으로 아래 값을 집계한 뒤 snapshot을 저장한다.

- `used_bytes`: active attachment의 `size_bytes` 합계
- `attachment_count`: active attachment 수
- `source`: `db_attachment_metadata`

### POST /api/system/storage-usage

수동 snapshot 저장도 유지한다.

```json
{
  "companyId": "company-sample-customer",
  "usedBytes": 1024,
  "attachmentCount": 3,
  "source": "manual"
}
```

## 기준

- 삭제된 첨부파일은 제외한다.
- `deleted_at IS NULL`
- `COALESCE(is_active, true) = true`
- R2 실시간 inventory 조회는 하지 않는다.
- storage 초과 차단 정책은 아직 연결하지 않는다.

## 다음 작업

0.9.90에서 시스템관리자 요금제 UI와 DB 연결 1차를 진행한다.
