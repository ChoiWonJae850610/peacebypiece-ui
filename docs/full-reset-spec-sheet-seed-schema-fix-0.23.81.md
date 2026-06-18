# Full Reset 작업지시서 Seed 스키마 정합성 수정 — 0.23.81

## 문제

PowerShell 개발·테스트 도구 9번 `Reset Database Schema` 실행 시 `db/schema/full_reset.sql`은 성공했지만, `db/test/scenario_seed.sql`에서 다음 오류가 발생했다.

```text
column "memo" of relation "spec_sheets" does not exist
```

## 원인

현재 `spec_sheets` 스키마에는 과거의 `memo` 컬럼이 없지만, `scenario_seed.sql`의 작업지시서 fixture INSERT 컬럼과 9개 VALUES에는 해당 필드가 남아 있었다.

## 수정

- `INSERT INTO spec_sheets` 컬럼 목록에서 `memo` 제거
- 작업지시서 fixture 9개의 과거 memo 값 제거
- 작업지시서 상태, 납기일, 수량, 활성 및 휴지통 상태 fixture는 유지
- `full_reset.sql`에는 컬럼을 다시 추가하지 않음

## 판단

현재 앱과 reset schema가 `spec_sheets.memo`를 사용하지 않으므로 과거 Seed를 현행 스키마에 맞추는 것이 맞다. 메모 컬럼을 다시 생성하면 제거된 데이터 모델을 되살리는 부작용이 생길 수 있다.

## 확인

PowerShell 9번을 다시 실행해 다음 4개 SQL이 모두 OK인지 확인한다.

1. `db/schema/full_reset.sql`
2. `db/test/scenario_seed.sql`
3. `db/test/scenario_google_login_seed.sql`
4. `db/seed/system_admin_bootstrap_kty872.sql`

## DB Migration

없음. Full Reset용 fixture SQL 정합성 수정이다.
