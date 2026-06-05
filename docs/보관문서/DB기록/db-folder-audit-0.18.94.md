# 0.18.94 DB 보조 SQL 보관 기준 점검

## 목적

테스트 불가 상태에서 DB/API/R2/권한/작업지시서 흐름을 변경하지 않고, `db/` 폴더의 현재 역할과 보관 기준만 문서화한다.

## 현재 분류

| 경로 | 판단 | 비고 |
| --- | --- | --- |
| `db/schema/full_reset.sql` | 유지 | 개발 DB 전체 초기화 기준. 데이터 삭제 위험이 있으므로 운영 DB 실행 금지. |
| `db/schema/full_reset_smoke_test.sql` | 유지 | full reset 직후 핵심 table/view/index/catalog 검증용. |
| `db/schema/materials_schema_draft.sql` | 유지 후보 | 원단/부자재 schema 설계 참고용 draft. 현재 기준 schema와 충돌 여부는 추후 테스트 가능 시 재검토. |
| `db/migrations/*.sql` | 유지 | full reset 없이 개발 DB를 보정할 때 필요한 patch SQL 기록. |
| `db/seed/*.sql` | 유지 | 시스템 관리자와 시스템 기준정보 baseline 보조 seed. |
| `db/test/*.sql`, `db/test/*.md` | 유지 | 개발 fixture, 권한, 회사 범위, 워크플로우, Google login bridge 검증용. |

## 이번 패치에서 변경하지 않은 것

- DB schema 변경 없음
- seed SQL 변경 없음
- test SQL 변경 없음
- migration SQL 삭제 없음
- API route 변경 없음
- R2/첨부/메모/휴지통/purge/권한/작업지시서 상태 흐름 변경 없음

## 후속 점검 후보

테스트 가능 상태가 되면 아래 항목을 확인한다.

1. `full_reset.sql`의 내부 `Version` 주석이 현재 앱 버전과 너무 멀어졌는지 확인
2. `full_reset_smoke_test.sql`이 실제 최신 table/index/view를 모두 검사하는지 확인
3. `materials_schema_draft.sql`이 현재 `full_reset.sql`과 중복 또는 충돌하는지 확인
4. `db/test/scenario_seed.sql`이 현재 권한/역할/작업지시서 상태 정책을 충분히 포함하는지 확인
5. 과거 patch migration 중 full reset에 이미 흡수된 파일을 보관 문서로 이동할지 결정

## 결론

현재는 삭제보다 보관 기준 문서화가 안전하다. DB 관련 파일은 실제 실행 영향이 크므로, 테스트 가능 선언 전까지 SQL 내용 변경은 보류한다.
