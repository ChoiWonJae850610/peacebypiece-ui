# DB Patch SQL

Version: 0.9.95

이 폴더는 기존 DB를 업그레이드하기 위한 patch SQL을 누적하는 위치다.

## full_reset.sql과의 차이

`db/schema/full_reset.sql`:
- 새 개발 DB를 완전히 초기화할 때 사용한다.
- 기존 데이터가 삭제된다.
- 운영 DB 업그레이드용이 아니다.

`db/patches/*.sql`:
- 기존 데이터가 있는 DB에 변경분만 적용한다.
- 가능하면 idempotent하게 작성한다.
- 운영 적용 전 개발 DB에서 먼저 검증한다.

## 파일명 규칙

```text
patch_0.9.xx_short_description.sql
```

예:

```text
patch_0.9.95_add_audit_logs.sql
```

## 작성 순서

1. `patch_template.sql` 복사
2. 버전과 목적 작성
3. `ALTER`, `CREATE INDEX`, `CREATE VIEW`, `INSERT seed`, `backfill` 작성
4. full_reset 기준과 정합성 확인
5. 개발 DB에서 실행
6. 필요한 경우 smoke test 보강
