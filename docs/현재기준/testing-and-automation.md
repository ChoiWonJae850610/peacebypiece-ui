# Testing and Automation

- 기준 앱 버전: `0.24.11`
- 목적: 현재 테스트, Playwright, Functions E2E, PowerShell pipeline 검증 기준을 한 곳에 둔다.

## 기본 검증

저장소 변경 후에는 변경 범위에 맞는 `tools/pipeline/approved-workflow.ps1 -Action Verify` profile을 우선 사용한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Verify -Profile automation-infrastructure
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Plan -Profile automation-infrastructure -CommitMessage "chore: add approved workflow entry point" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Finish -Profile automation-infrastructure -CommitMessage "chore: add approved workflow entry point" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\verify-safe.ps1 -Profile repository-cleanup
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\verify-safe.ps1 -Profile id-control-roadmap
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\verify-safe.ps1 -Profile system-admin-storage
```

공통 검증은 `git diff --check`, PowerShell parse, package/lockfile 변경 확인, DB migration 변경 확인, secret/production 값 검사, `npm run build`, `npm run audit:wafl-mutations`를 포함한다.

## Playwright

현재 Playwright는 local dependency인 `@playwright/test`를 사용한다.

```bash
npm run test:e2e:install
npm run test:e2e
npm run test:e2e:headed
```

기본 base URL은 `http://127.0.0.1:3000`이다. 이미 dev server를 별도 실행 중이면 아래 값을 사용한다.

```powershell
$env:PLAYWRIGHT_SKIP_WEB_SERVER="1"
npm run test:e2e
```

보호 route 테스트는 실제 Google OAuth 대신 앱 세션 구조와 같은 HMAC 쿠키를 생성한다. `WAFL_SESSION_SECRET` 또는 `GOOGLE_OAUTH_CLIENT_SECRET`이 없으면 관련 테스트는 skip될 수 있다.

## Functions E2E

`/functions` 관련 Playwright suite는 기본으로 비활성이다. dev/test fixture가 준비된 경우에만 실행한다.

```bash
npm run test:e2e:functions-core
npm run test:e2e:functions-responsive
```

필수 조건:

- `WAFL_FUNCTIONS_E2E_ENABLED=1` 또는 `WAFL_FUNCTIONS_RESPONSIVE_E2E_ENABLED=1`
- `WAFL_SESSION_SECRET` 또는 `GOOGLE_OAUTH_CLIENT_SECRET`
- dev/test 전용 서버와 fixture

production에서는 실행하지 않는다. 현재 suite는 화면 진입, route, 기본 문구, overflow와 viewport 계약을 우선 확인하며 생성·수정·삭제 mutation을 자동 실행하지 않는다.

## DB/API Smoke

DB/API smoke는 현재도 `scripts/smoke-db-api.mjs`와 `npm run test:smoke:db-api`가 기준이다. 실행 전에는 승인된 개발/테스트 DB URL이 필요하며 운영 DB에서는 실행하지 않는다.

검증 성격:

- 필수 schema/table/column 계약 확인
- 멤버 생명주기 상태 전환 계약 확인
- 회사 계정 요청 승인/반려 계약 확인
- 정책 동의 저장/조회/upsert 계약 확인
- 회사 파일, 구독, 저장공간 관련 계약 확장 확인

write 검증은 transaction 안에서 실행하고 마지막에 rollback하는 것을 기준으로 한다. smoke 결과 기록 문서는 archive 이력으로 보관하며, 현재 실행 기준은 script, `package.json` script, pipeline wrapper, 이 문서를 우선한다.

## PowerShell Pipeline

Canonical entry point는 `tools/pipeline/peacebypiece-auto-pipeline.ps1`이다. 설정은 `tools/pipeline/pipeline.config.psd1`에서 관리하며 DB URL, 비밀번호, R2 key, token 같은 비밀값은 config에 저장하지 않는다.

구성:

- `peacebypiece-auto-pipeline.ps1`: 메인 메뉴, npm dev/build 토글, 개발·테스트 메뉴
- `download-watcher.ps1`: 다운로드 폴더 감시 루프
- `pipeline-common.ps1`: 공통 설정, 경로, 로그, guard helper
- `pipeline-patch-processing.ps1`: commit-meta, ZIP 안정화, 패치 적용, Git/build/archive 처리
- `verify-safe.ps1`: 안전 검증 wrapper
- `finish-version.ps1`: explicit path Git finish wrapper
- `approved-workflow.ps1`: Verify, Handoff, Plan, Finish 고정 승인 wrapper

`approved-workflow.ps1 -Action Finish`는 PASS verification result의 profile, branch, HEAD, explicit path, changed fingerprint가 현재 작업과 일치할 때만 `finish-version.ps1 -Execute`를 호출한다. 삭제된 tracked 파일도 explicit path allowlist 안에서만 처리한다.

`approved-workflow.ps1`는 `Verify`, `Handoff`, `Plan`, `Finish` 모드만 허용하며 arbitrary command, arbitrary script path, `Invoke-Expression`, `cmd /c`, `git add .`, `git add -A`, force/amend/reset/clean/checkout/rebase/merge, dependency install, DB/R2 mutation, Seed/Reset/Cleanup/Migration, production access를 수행하지 않는다.

## 보류 및 주의

- 실제 DB smoke, Seed execute, Cleanup execute, Reset, Migration, R2 mutation은 명시 승인 없이는 실행하지 않는다.
- `playwright-report/`, `test-results/`, `artifacts/`, `.tmp/`는 생성 산출물이며 Git에 포함하지 않는다.
- build-fix 버전별 문서는 current 정책으로 병합된 뒤 Git history로 충분한 단순 수정 기록은 삭제할 수 있다.
