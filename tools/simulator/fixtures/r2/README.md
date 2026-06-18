# R2 simulator fixtures

작고 고정된 샘플만 보관한다. 대량·대용량 파일은 `.tmp/simulator/r2/`에 실행 시 생성한다.

- `local-small-scenario.json`: DB와 R2에 접속하지 않고 `simulator:r2:plan`, `simulator:r2:generate`를 검증하는 고정 시나리오
- Plan은 파일과 manifest를 생성하지 않는다.
- Local Generate는 `.tmp/simulator/r2/` 아래에만 파일과 manifest를 생성한다.
