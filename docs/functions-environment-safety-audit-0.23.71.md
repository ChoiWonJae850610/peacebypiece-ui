# `/functions` 테스트 환경 안전 감사 기반 — 0.23.71

## 목적

실제 테스트 데이터를 만들기 전에 현재 실행 환경이 운영 데이터와 분리되어 있는지, 사용자가 비밀값을 직접 확인하지 않고도 자동 점검할 수 있는 기반을 제공한다.

## 추가 명령

```bash
npm run test:functions:environment
npm run test:functions:environment-contract
```

환경 감사 명령은 다음 항목을 확인한다.

- runtime이 development/dev/local/test/demo 중 하나인지
- DB URL이 설정되어 있고 PostgreSQL 형식인지
- DB host/database 이름에 local/test/dev/demo/staging/sandbox/wafl-fn 표식이 있는지
- fixture prefix가 `wafl-fn`인지
- R2 S3 또는 Worker 설정이 존재하는지
- `WAFL_FUNCTIONS_TEST_R2_PREFIX`가 테스트 전용 prefix인지
- E2E session secret이 존재하는지
- Playwright 대상 URL이 local/test/dev 성격인지
- 실제 seed 및 cleanup adapter가 아직 미연결인지

## 안전 정책

- DB와 R2에 실제 접속하지 않는다.
- 데이터 생성·수정·삭제를 수행하지 않는다.
- DB 비밀번호와 URL query를 출력하지 않는다.
- 환경 상태는 `artifacts/test-reports/functions/environment-audit-latest.json`에 저장한다.
- 설정 누락은 감사 명령 실패가 아니라 `executionReady=false`로 보고한다.
- 실제 seed/cleanup adapter 연결 시에는 `executionReady=true`를 필수조건으로 사용한다.

## 현재 판단

- 테스트 회사 fixture와 `wafl-fn` prefix는 이미 존재한다.
- seed/cleanup execute 명령은 안전검사를 통과해도 실제 DB mutation 직전에 중단된다.
- R2 reconciliation도 현재 dry-run이며 실제 객체 변경을 수행하지 않는다.
- 따라서 0.23.71 자체는 운영 DB/R2를 변경하지 않는다.
