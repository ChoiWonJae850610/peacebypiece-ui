# R2 더미 파일 생성 스크립트 사용법 — 0.18.92

이 문서는 `scripts/seed-r2-demo-files.mjs`를 PowerShell에서 실행하는 방법을 정리한다.

> 현재 이 스크립트는 개발·시드·검증 보조용이다. 테스트 불가 기간에는 실행 동작을 변경하지 않고 문서 기준만 보강한다. 운영 DB/R2에서 실행하지 않는다.

## 목적

`db/seed/realistic_workorders_seed.sql`이 만든 `attachments.storage_key`를 기준으로 실제 R2 더미 파일을 생성/업로드/검증한다.

0.10.90 기준으로 이 스크립트는 임의의 R2 key를 만들지 않고, DB의 `attachments` 테이블에서 아래 조건을 만족하는 첨부만 읽는다.

- `id LIKE 'realistic-attachment-%'`
- `storage_key LIKE 'workorders/%'`
- `storage_key LIKE 'workorders/' || order_id || '/%'`
- 기본값: 삭제되지 않은 활성 첨부만 대상

즉, DB seed의 작업지시서 첨부와 R2 object가 같은 `storage_key`로 매칭된다.


> 주의: 본 문서는 `realistic_workorders_seed.sql` 기반 개발 fixture의 R2 더미 파일 생성을 설명한다. 실제 운영 첨부 경로 정책과 다를 수 있으므로, 운영 경로 정책 변경은 별도 설계/테스트 가능 상태에서만 반영한다.

## 실행 전제

- 운영 DB/R2에서 실행하지 않는다.
- 개발 DB 또는 초기화 가능한 테스트 DB에서만 실행한다.
- `psql`, `node` 명령을 PowerShell에서 사용할 수 있어야 한다.
- `.env.local`의 실제 값은 문서나 Git에 기록하지 않는다.
- R2 업로드/검증은 Worker 기반 환경변수가 필요하다.

## 1. 프로젝트 루트로 이동

```powershell
cd C:\CWJ_Project\peacebypiece-2.0
```

## 2. DB seed 실행

개발 DB URL을 현재 PowerShell 세션에 설정한다.

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

전체 초기화가 필요한 경우 먼저 실행한다.

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
```

통계/작업지시서/첨부 metadata seed를 실행한다.

```powershell
psql $env:DATABASE_URL -f db/seed/realistic_workorders_seed.sql
```

SQL 마지막 결과에서 아래 값을 확인한다.

- `attachment_metadata_count`
- `stats_fixture_attachment_count`
- `matched_storage_key_count`
- `attachment_metadata_mb`

`matched_storage_key_count`는 R2 스크립트가 읽을 수 있는 작업지시서 연결 첨부 수를 의미한다.

## 3. R2 Worker 환경변수 설정

업로드/검증이 필요한 경우 현재 PowerShell 세션에 Worker 환경변수를 설정한다.

```powershell
$env:R2_WORKER_UPLOAD_URL="https://YOUR_WORKER_URL"
$env:R2_WORKER_UPLOAD_SECRET="YOUR_WORKER_SECRET"
```

주의: 실제 URL/secret은 문서에 적지 않는다.

## 4. 업로드 대상 계획만 확인

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=plan
```

통계 검증용 9xx 작업지시서 첨부만 확인하려면 다음처럼 실행한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=plan --only-stats-fixtures
```

특정 작업지시서 첨부만 확인하려면 다음처럼 실행한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=plan --workorder-id=realistic-spec-906
```

## 5. 로컬 더미 파일 생성

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=generate
```

통계 검증용 9xx 작업지시서 첨부만 생성하려면 다음처럼 실행한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=generate --only-stats-fixtures
```

생성물은 `.tmp/r2-demo-files` 아래에 만들어진다. `.tmp/`는 Git 추적 대상이 아니다.

## 6. R2 업로드

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=upload --confirm-upload
```

계획/생성/업로드를 한 번에 처리하려면 다음처럼 실행한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=all --confirm-upload
```

## 7. R2 파일 검증

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=verify
```

## 8. manifest 확인

스크립트는 `.tmp/r2-demo-manifests` 아래에 manifest JSON을 만든다.

manifest에는 아래 정보가 들어간다.

- `attachmentId`
- `orderId`
- `orderTitle`
- `orderStatus`
- `reorderRound`
- `key`
- `localPath`
- `contentType`
- `size`
- `sourceType`

이 manifest를 보면 DB 작업지시서 첨부와 R2 object가 어떤 key로 매칭됐는지 확인할 수 있다.

## 9. 화면 확인

DB seed와 R2 더미 파일 업로드 후 아래 화면을 확인한다.

```text
/admin/dashboard
/admin/files
작업지시서 상세 화면
```

확인 기준:

- 작업지시서 상세의 디자인/문서/메모 첨부가 보이는지
- `/admin/files` 저장소 사용량에 첨부 용량이 반영되는지
- `/admin/dashboard` 통계 카드와 TOP5가 빈 화면 없이 표시되는지
- manifest의 `key`와 DB `attachments.storage_key`가 같은지

## 주의

- `--include-deleted`를 붙이면 삭제된 첨부까지 대상에 포함한다.
- 기본 테스트에서는 `--include-deleted`를 사용하지 않는다.
- Worker 정책상 허용되지 않는 확장자는 업로드에서 제외될 수 있다.
- 0.10.90 seed 기준 메모 첨부도 `.pdf` / `application/pdf`로 생성한다.
- 기존 0.10.89 seed를 이미 실행했다면 `full_reset.sql`부터 다시 실행해 `.txt` 메모 metadata를 제거한 뒤 재시도한다.
