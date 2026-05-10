# 0.9.224342 통계 seed와 R2 더미 파일 매칭 구조 보정

## 목표

DB 임시 데이터와 R2 더미 파일이 같은 작업지시서/첨부 기준으로 연결되도록 보정했다.

## 변경 요약

- `attachments.storage_key`가 `workorders/{order_id}/...` 형식과 일치하는 항목만 R2 더미 파일 대상으로 읽도록 스크립트를 보정했다.
- R2 manifest에 작업지시서 제목, 상태, 리오더 차수를 함께 기록하도록 보정했다.
- 통계 검증용 9xx 작업지시서 첨부를 small preset에서 우선 선택하도록 정렬했다.
- `--only-stats-fixtures` 옵션을 추가해 통계 검증용 9xx 첨부만 대상으로 실행할 수 있게 했다.
- `--workorder-id=...` 옵션을 추가해 특정 작업지시서 첨부만 대상으로 실행할 수 있게 했다.
- seed SQL의 slot 4 첨부를 zip에서 PDF로 변경해 Worker 기본 허용 정책에서 제외되지 않도록 보정했다.
- seed SQL 마지막 결과에 `stats_fixture_attachment_count`, `matched_storage_key_count`를 추가했다.
- `scripts/seed-r2-demo-files-usage.md`를 추가해 PowerShell 실행법을 scripts 폴더에서 바로 확인할 수 있게 했다.

## 실행 순서

```powershell
cd C:\CWJ_Project\peacebypiece-2.0
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
psql $env:DATABASE_URL -f db/schema/seed_realistic_workorders_0_9_2227.sql
node scripts/seed-r2-demo-files.mjs --preset=small --mode=plan
node scripts/seed-r2-demo-files.mjs --preset=small --mode=all --confirm-upload
node scripts/seed-r2-demo-files.mjs --preset=small --mode=verify
```

## 검증 기준

- SQL 결과의 `matched_storage_key_count`가 0보다 커야 한다.
- manifest의 `key`가 DB `attachments.storage_key`와 같아야 한다.
- manifest의 `orderId`가 작업지시서 id와 같아야 한다.
- 작업지시서 상세 화면에서 같은 첨부가 보여야 한다.
- `/admin/files` 저장소 화면에서 같은 첨부가 보여야 한다.

## 다음 작업

작업지시서 화면 첫 진입 속도 문제는 seed/R2 매칭과 별도 문제다. 다음 버전에서 목록/상세 lazy load 구조를 설계한다.
