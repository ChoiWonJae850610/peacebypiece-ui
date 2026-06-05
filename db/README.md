# WAFL DB 보조 파일 안내

- 기준 앱 버전: `0.19.94.3`
- 이 폴더는 운영 앱 런타임 코드가 아니라 개발 DB 초기화, 보정, seed, 검증을 위한 SQL/문서 보관 영역이다.
- 사용자가 테스트 가능하다고 명시하기 전까지는 SQL 동작 변경보다 역할 분류와 실행 조건 문서화를 우선한다.

## 폴더 구분

| 폴더 | 역할 | 실행 기준 |
| --- | --- | --- |
| `schema/` | 개발 DB 전체 초기화 기준 schema와 smoke test | 개발/초기화 가능한 DB에서만 실행 |
| `migrations/` | full reset 없이 기존 개발 DB에 누락 컬럼/제약/인덱스를 보정하는 패치 SQL | 필요한 패치만 선별 실행 |
| `seed/` | 시스템 관리자, 시스템 기준정보 등 baseline 보조 seed | 개발 DB 또는 초기 설정 DB에서 선별 실행 |
| `test/` | fixture 생성, 회사 범위, 권한, 워크플로우, 로그인 bridge 검증 | 개발/test DB 전용 |

## 주의

- `.env.local`, 실제 DB URL, R2 URL, 토큰, secret 값은 이 폴더에 기록하지 않는다.
- `full_reset.sql`은 데이터를 삭제하는 파일이므로 운영 DB에서 직접 실행하지 않는다.
- `db/test/*` 파일은 실제 Google 로그인 테스트를 돕는 개발 fixture이며 운영 데이터 생성용이 아니다.
- full reset 기준 schema를 바꾸는 경우 `full_reset_smoke_test.sql`, seed, test SQL 영향도 함께 확인한다.


## 0.19.94.3 재점검 결과

현재 `db/` 하위 파일은 삭제하지 않는다. `full_reset.sql`은 개발 초기화 기준이며, `full_reset_smoke_test.sql`은 schema 적용 후 검증 기준이다. `migrations/`는 full reset 없이 과거 개발 DB를 보정할 때 참고하는 보조 파일이고, `seed/`와 `test/`는 수동/자동 검증에 사용된다.

테스트 불가 기간에는 SQL 내용을 바꾸지 않고, 다음 기능 변경에서 schema를 수정할 때만 full reset과 smoke test를 함께 갱신한다.
