# WAFL Simulator

테스트용 DB·R2·작업지시서·발주서 데이터를 준비하는 전용 도구 영역이다.

- `commands/`: PowerShell과 npm이 호출하는 실행 진입점
- `fixtures/`: 반복 사용 가능한 고정 테스트 자료
- `adapters/`: 실제 dev/test DB·R2 연결 코드(운영 연결 금지)
- 실행 산출물: `.tmp/simulator/`
- 테스트 결과: `artifacts/test-reports/`

`tests/`는 기능 검증 코드이고, `tools/simulator/`는 검증에 필요한 시험 환경을 만드는 도구다.

## Local R2 simulator commands

- `npm run simulator:r2:plan`: 생성 계획만 확인한다.
- `npm run simulator:r2:generate`: 기존 로컬 simulator 출력물을 먼저 정리한 뒤 `.tmp/simulator/r2`에 새 파일과 manifest를 생성한다.
- `npm run simulator:r2:cleanup-local`: `.tmp/simulator/r2/files`와 `.tmp/simulator/r2/manifests`만 삭제한다. DB와 실제 R2에는 접근하지 않는다.


## Adapter planning commands

- `npm run simulator:adapter:plan`: DB schema와 fixture의 매핑, cleanup 순서, R2 prefix를 파일 기준으로 점검한다. DB/R2 접속과 변경은 없다.
- `npm run simulator:adapter:contract`: adapter manifest의 production 차단·mutation 비활성 정책을 검사한다.
- 실제 seed/upload/cleanup adapter는 아직 비활성 상태이며 `executionReady=false`를 유지한다.


## DB Simulator commands (0.23.76)

```bash
npm run simulator:db:contract
npm run simulator:db:seed:dry-run
npm run simulator:db:cleanup:dry-run
npm run simulator:db:seed:execute
npm run simulator:db:cleanup:execute
```

- Dry-run commands never connect to the database.
- Execute commands require a non-production runtime, a DB target whose host/database is identifiable as local/dev/test/demo/staging/sandbox, `WAFL_SIMULATOR_ENABLE_DB_MUTATION=1`, and an exact confirmation value.
- Seed uses one transaction, an advisory lock, deterministic `wafl-fn` IDs, and idempotent upserts.
- Cleanup deletes only fixture company IDs beginning with `wafl-fn`; database cascades remove their dependent rows.
- R2 upload/delete remains disabled. Storage usage rows are manual simulator snapshots until R2 reconciliation is implemented.
