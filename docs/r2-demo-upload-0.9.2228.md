# 0.9.2228 — R2 더미 파일 생성/업로드 스크립트

## 목적

`0.9.2227` realistic DB seed가 생성한 `attachments` metadata를 기준으로 로컬 더미 파일을 만들고, 실제 R2 Worker 업로드 경로로 업로드한다.

이번 버전은 **small preset**을 기본으로 한다. 처음부터 500MB를 올리지 않고, 30~50MB 수준으로 R2 업로드/미리보기/다운로드 흐름을 먼저 검증한다.

## 추가 파일

```text
scripts/seed-r2-demo-files.mjs
```

## 필요한 환경변수

스크립트는 secret을 코드에 저장하지 않는다. 로컬 환경변수 또는 `.env.local`에 이미 있는 값을 사용한다.

```text
DATABASE_URL
R2_WORKER_UPLOAD_URL
R2_WORKER_UPLOAD_SECRET
```

PowerShell에서 임시로 불러와 실행하려면 현재 프로젝트의 `.env.local` 값을 먼저 환경변수로 올린 뒤 실행해야 한다. `.env.local`을 커밋하거나 패치에 포함하면 안 된다.

## 실행 전 DB 준비

Neon SQL Editor에서 아래 순서로 실행한다.

```sql
-- 1. 전체 초기화
db/schema/full_reset.sql

-- 2. 기본 smoke seed
db/schema/full_reset_smoke_test.sql

-- 3. realistic seed
db/schema/seed_realistic_workorders_0_9_2227.sql

-- 4. category depth 보정
db/schema/seed_realistic_category_depth_0_9_22271.sql
```

## 실행 순서

### 1. 계획 확인

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=plan
```

확인 항목:

```text
selected 파일 수
total MB
.tmp/r2-demo-manifests/r2-demo-small-plan.json
```

### 2. 더미 파일 생성

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=generate
```

생성 위치:

```text
.tmp/r2-demo-files/workorders/...
```

### 3. R2 업로드

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=upload --confirm-upload
```

`--confirm-upload`가 없으면 실제 업로드를 중단한다. 실수로 대량 업로드하는 것을 막기 위한 안전장치다.

### 4. R2 검증

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=verify
```

## 한 번에 실행

업로드까지 한 번에 진행하려면 다음을 사용한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=all --confirm-upload
```

초기에는 `plan → generate → upload → verify` 순서로 나눠 실행하는 것을 권장한다.

## preset 기준

```text
small
- 최대 50개 attachment metadata
- 약 30~50MB
- R2 업로드 흐름 검증용

medium
- 최대 300개 attachment metadata
- 약 500MB
- 저장소 통계/기간별 파일 테스트용

large
- 최대 1200개 attachment metadata
- 약 2GB
- 용량 한도/요금제 테스트용
```

## 화면 테스트

업로드 후 확인할 화면:

```text
/worker
- 작업지시서 상세의 디자인/첨부/메모 표시
- 이미지 미리보기
- PDF/ZIP 다운로드

/admin/files
- 저장소 사용량
- 파일 목록
- 휴지통 후보
- 삭제/복구/영구삭제 후보

/admin/dashboard
- 현재 저장소 사용량 요약
```

## 주의

- 운영 DB/R2에서 실행하지 않는다.
- `.env.local`은 절대 커밋하지 않는다.
- medium/large preset은 small 검증 후 실행한다.
- R2 Standard 기준 small preset 비용 부담은 매우 작지만, 반복 실행은 operations와 저장소 사용량을 누적시킬 수 있다.
