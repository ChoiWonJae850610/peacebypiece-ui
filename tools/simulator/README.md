# WAFL Simulator

테스트용 DB·R2·작업지시서·발주서 데이터를 준비하는 전용 도구 영역이다.

- `commands/`: PowerShell과 npm이 호출하는 실행 진입점
- `fixtures/`: 반복 사용 가능한 고정 테스트 자료
- `adapters/`: 실제 dev/test DB·R2 연결 코드(운영 연결 금지)
- 실행 산출물: `.tmp/simulator/`
- 테스트 결과: `artifacts/test-reports/`

`tests/`는 기능 검증 코드이고, `tools/simulator/`는 검증에 필요한 시험 환경을 만드는 도구다.
