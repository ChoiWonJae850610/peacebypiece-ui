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

