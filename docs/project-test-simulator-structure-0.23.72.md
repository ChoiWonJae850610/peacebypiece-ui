# 프로젝트 테스트·Simulator 구조 정리 0.23.72

## 공식 위치
- 테스트 코드: `tests/`
- 테스트 환경 생성 도구: `tools/simulator/`
- 실행 결과: `artifacts/`
- 임시 생성 파일: `.tmp/simulator/`
- Cloudflare Worker 배포 소스: `cloudflare/` (이번 버전 이동 없음)

## 적용
- R2 demo 생성기를 `tools/simulator/commands/r2-demo-files.mjs`로 이동
- Playwright 결과를 `artifacts/playwright/`로 통합
- functions JSON 결과를 `artifacts/test-reports/functions/`로 통합
- 기존 `playwright-report/`, `test-results/`, `reports/`는 legacy 생성물로 정리 대상
- DB/R2 실제 adapter는 안전 감사 완료 전 연결하지 않음

## PowerShell
- v19.1에서 Environment Audit, R2 Plan, R2 Local Generate 메뉴를 연결
- upload, cleanup, reset은 전체 검사에 포함하지 않음
