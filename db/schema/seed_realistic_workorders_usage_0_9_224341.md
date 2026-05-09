# 통계 테스트 seed 실행 방법 — 0.9.224341

이 문서는 `db/schema/seed_realistic_workorders_0_9_2227.sql` 실행 방법을 PowerShell 기준으로 정리한다.

## 목적

`/admin/dashboard` 통계 화면의 주요 지표가 빈 화면 없이 검증되도록 개발 DB에 realistic seed 데이터를 넣는다.

0.9.224341 기준으로 아래 케이스를 명시적으로 포함한다.

- 완료 작업지시서 → 발주수량 상위 5개
- 리오더 → 리오더 차수 상위 5개
- 불량 작업지시서 → rejected / is_rework 기준 상위 5개
- 생산품 유형 비율 → 1차 / 2차 / 3차 카테고리 분포
- 업체 성과 → 공장별 생산량, 납기 지연, 검수 이슈
- 기간 필터 → 최근 7일, 최근 30일, 직접 기간 선택 검증

## 실행 전제

- 운영 DB에서 실행하지 않는다.
- 개발 DB 또는 초기화 가능한 테스트 DB에서만 실행한다.
- `.env.local`에 개발 DB 접속 문자열이 있어야 한다.
- `psql` 명령을 PowerShell에서 사용할 수 있어야 한다.
- 전체 초기화 후 테스트하려면 `full_reset.sql`과 `full_reset_smoke_test.sql`을 먼저 실행한다.

## PowerShell 실행 예시

프로젝트 루트로 이동한다.

```powershell
cd C:\CWJ_Project\peacebypiece-2.0
```

개발 DB URL을 현재 PowerShell 세션에 설정한다.

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

전체 초기화가 필요한 경우 먼저 실행한다.

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
```

통계 테스트 seed를 실행한다.

```powershell
psql $env:DATABASE_URL -f db/schema/seed_realistic_workorders_0_9_2227.sql
```

## 실행 후 확인

SQL 마지막에 아래 집계가 출력된다.

- `spec_sheet_count`
- `order_count`
- `partner_count`
- `attachment_metadata_count`
- `attachment_metadata_mb`
- `trash_item_count`
- `memo_count`

이후 앱에서 아래 화면을 확인한다.

```powershell
npm run dev
```

브라우저에서 확인한다.

```text
/admin/dashboard
```

## 화면 확인 항목

- 7일 / 30일 기간 변경
- 직접 기간 선택
- 완료 작업지시서 클릭 → 발주수량 상위 5개
- 리오더 클릭 → 리오더 차수 상위 5개
- 불량 작업지시서 클릭 → 불량 작업지시서 상위 5개
- 생산품 유형 비율
- 선택항목 품목 TOP5
- 업체 성과
- 업체별 납기 / 검수 지표
- 한국어 / 영어 전환

## R2 더미 파일 업로드가 필요한 경우

이 seed는 attachments metadata만 만든다. 실제 R2 object 파일까지 만들려면 별도 스크립트를 사용한다.

```powershell
node scripts/seed-r2-demo-files.mjs --preset=small --mode=generate
node scripts/seed-r2-demo-files.mjs --preset=small --mode=upload --confirm-upload
node scripts/seed-r2-demo-files.mjs --preset=small --mode=verify
```

R2 더미 파일 생성물은 `.tmp/` 아래에 생성되며 Git 추적 대상이 아니다.

## 주의

- 이 seed는 `company-sample-customer` 기준이다.
- 기존 `realistic-%` / `stats-demo-%` seed 데이터는 먼저 삭제하고 다시 넣는다.
- 실제 운영 데이터 보존이 필요한 DB에서는 실행하지 않는다.
- DB schema를 변경하지 않는다.
