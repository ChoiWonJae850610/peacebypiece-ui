# WAFL DB 보조 파일 안내

- 기준 앱 버전: `0.24.11`
- 이 폴더는 운영 앱 런타임 코드가 아니라 개발 DB 초기화, 보정, seed, 검증을 위한 SQL/문서 보관 영역이다.
- 실제 DB/R2/Seed/Reset/Cleanup/Migration 실행은 명시 승인 후에만 진행한다.

## 폴더 구분

| 폴더 | 역할 | 실행 기준 |
| --- | --- | --- |
| `schema/` | 개발 DB 전체 초기화 기준 schema와 smoke test | 개발/초기화 가능한 DB에서만 실행 |
| `migrations/` | full reset 없이 기존 DB에 누락 컬럼/제약/인덱스를 보정하는 패치 SQL | 필요한 패치만 선별 실행 |
| `seed/` | 시스템 관리자, 시스템 기준정보 등 baseline 보조 seed | 개발 DB 또는 초기 설정 DB에서 선별 실행 |
| `test/` | fixture 생성, 회사 범위, 권한, 워크플로우, 로그인 bridge 검증 | 개발/test DB 전용 |

## 현재 정책

- `db/schema/full_reset.sql`은 canonical 개발 schema다. 데이터를 삭제하는 파일이므로 운영 DB에서 직접 실행하지 않는다.
- `db/schema/full_reset_smoke_test.sql`은 full reset 직후 핵심 table/index/view/catalog를 확인한다.
- `db/migrations/*`는 기존 DB 보정과 감사 이력이다. `full_reset.sql`에 반영됐더라도 이번 cleanup에서는 삭제·이동·archive하지 않는다.
- `db/seed/system_standards_seed.sql`은 기존 DB를 유지하면서 시스템 기준정보 seed를 보강할 때 사용하는 canonical seed SQL이다.
- `db/seed/system_admin_bootstrap_kty872.sql`은 시스템 관리자 bootstrap seed다. 민감한 운영 의도가 있으므로 자동 삭제하지 않는다.

## 주의

- `.env.local`, 실제 DB URL, R2 URL, 토큰, secret 값은 이 폴더에 기록하지 않는다.
- DB schema 변경 시 `full_reset.sql`, `full_reset_smoke_test.sql`, seed, repository/API, 관련 docs를 같은 범위에서 함께 확인한다.
- Reset/Seed/Cleanup/Migration execute mode는 production/runtime/fingerprint/prefix/confirmation guard를 유지해야 한다.
- repository cleanup 작업은 SQL 내용을 변경하거나 실제 DB 명령을 실행하지 않는다.
