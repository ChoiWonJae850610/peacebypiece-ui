# PeaceByPiece SQL 파일 운용 정책

Version: 0.9.95

## 목적

`full_reset.sql`과 향후 추가될 `patch_*.sql`의 역할을 분리해 DB 초기화와 기존 DB 업그레이드 절차가 섞이지 않도록 한다.

## SQL 파일 분류

### 1. full reset 계열

대상:
- `db/schema/full_reset.sql`
- `db/schema/full_reset_smoke_test.sql`

용도:
- 개발 DB를 완전히 초기화한다.
- 전체 테이블/view/index/seed를 다시 만든다.
- 실행 후 `full_reset_smoke_test.sql`로 핵심 구조를 검증한다.

주의:
- 기존 데이터가 삭제된다.
- 운영 DB에 직접 실행하지 않는다.
- 기존 DB 업그레이드용으로 사용하지 않는다.

### 2. patch SQL 계열

권장 위치:
- `db/patches/`

권장 파일명:
- `patch_0.9.xx_description.sql`

용도:
- 이미 데이터가 있는 개발/운영 DB를 다음 구조로 올린다.
- `ALTER TABLE`, `CREATE INDEX`, `CREATE VIEW`, `INSERT seed`, `UPDATE backfill`을 포함할 수 있다.
- destructive 변경은 별도 검토 후 진행한다.

주의:
- patch SQL은 idempotent하게 작성하는 것을 원칙으로 한다.
- `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DO $$ BEGIN ... END $$` guard를 우선 사용한다.
- 데이터 삭제가 필요한 경우 파일 상단에 명확히 표시한다.

## 실행 기준

### 새 개발 DB 또는 전체 초기화

```sql
\i db/schema/full_reset.sql
\i db/schema/full_reset_smoke_test.sql
```

### 기존 DB 업그레이드

```sql
\i db/patches/patch_0.9.xx_description.sql
```

## 금지

- 기존 DB 업그레이드를 위해 `full_reset.sql`을 실행하지 않는다.
- patch SQL에 secret, token, DB URL을 넣지 않는다.
- 실제 운영 데이터 삭제 SQL을 자동 적용하지 않는다.
- 기능 코드 변경과 무관한 schema 변경을 임의로 섞지 않는다.

## 다음 원칙

1. schema 전체 기준은 `full_reset.sql`에 반영한다.
2. 기존 DB 업그레이드 기준은 `db/patches`에 누적한다.
3. 새 테이블/컬럼이 생기면 full_reset과 patch SQL 양쪽 관점에서 판단한다.
4. smoke test는 full_reset 실행 직후 검증 전용이다.
