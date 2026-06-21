# PeaceByPiece Auto Pipeline

## 실행

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\pipeline\peacebypiece-auto-pipeline.ps1
```

`tools/pipeline/peacebypiece-auto-pipeline.ps1` is the canonical PowerShell menu entry point and is tracked in Git. Patch, old-version, backup, temporary, and copied PowerShell variants remain ignored by `.gitignore`.

설정은 `pipeline.config.psd1`에서 관리합니다. DB URL, 비밀번호, R2 key, token 같은 비밀값은 이 파일에 넣지 않습니다.

## 프로젝트 루트

`Paths.ProjectDir`가 비어 있으면 스크립트 위치(`tools/pipeline`)에서 두 단계 위의 프로젝트 루트를 자동 사용합니다.

## Simulator DB 승인

`Simulator.ApprovedDbFingerprint`는 DB URL의 host/database 조합을 해시한 식별값입니다. Seed와 cleanup은 현재 연결 대상의 fingerprint가 이 값과 정확히 일치할 때만 실행됩니다.

## Reset Database Schema Guard

Development/test menu 9 requires the exact confirmation phrase `RESET WAF-FN SCHEMA`. Before the SQL runner can be prepared, the menu calls the shared reset guard in `pipeline-common.ps1` and blocks production runtime, missing/unknown runtime, non-PostgreSQL URLs, approved fingerprint mismatch, non-`wafl-fn` prefix, and confirmation mismatch. Logs must report only PASS/BLOCKED style status and must not print the DB URL, host, database name, credential, token, secret, or actual fingerprint.

## 스크립트 구성

- `peacebypiece-auto-pipeline.ps1`: 메인 메뉴, npm dev/build 토글, 개발·테스트 메뉴
- `download-watcher.ps1`: 다운로드 폴더 감시 루프
- `pipeline-common.ps1`: 공통 설정 로드, 경로, 로그 및 기본 유틸
- `pipeline-patch-processing.ps1`: commit-meta 파싱, 다운로드 완료 판별, ZIP/경로 검증, 패치 적용, Git/build/archive 처리
- `pipeline.config.psd1`: 사용자 환경 경로와 실행 옵션

메인 메뉴 1번은 `download-watcher.ps1`을 숨김 백그라운드 PowerShell 프로세스로 시작·종료합니다. watcher PID, 상태 JSON, heartbeat, 로그는 설정된 Logs 경로에 저장되며 메인 메뉴를 종료해도 watcher는 계속 실행됩니다.

메인 메뉴 구성:

1. Download 폴더 감시 시작/종료 토글
2. npm run dev 시작/종료 토글
3. 패치 적용 후 자동 Build 토글
4. Flush folders - 산출물 폴더 비우기
5. 개발 / 테스트 도구

## 현재 저장소 전달본 생성

개발 / 테스트 도구 메뉴 7번 `현재 저장소 ZIP + repo-state 생성`은 현재 로컬 저장소 기준 전달본을 만듭니다. 권장 번호 22번은 기존 `Simulator DB Cleanup Execute`가 사용 중이므로, 같은 2자리 메뉴 체계에서 가장 가까운 빈 번호인 7번을 사용합니다.

이 메뉴는 read/export-only 작업입니다. 원격 다운로드, Build, npm install/npm ci, dependency 변경, Git add/commit/push, checkout/reset/clean, DB/R2 접근, Seed/Reset/Cleanup/Migration, 파일 삭제, production 접근을 수행하지 않습니다. Working tree가 dirty여도 생성할 수 있으며, 이 경우 콘솔과 repo-state 첫 부분에 `WARNING: WORKING TREE IS NOT CLEAN`을 표시합니다.

직접 실행:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\peacebypiece-auto-pipeline.ps1 -CreateLocalRepoHandoff
```

출력 위치는 기존 pipeline 정책을 재사용합니다.

- ZIP: `Paths.BuildZipDir` 아래 `peacebypiece-ui-{APP_VERSION}.zip`
- repo-state: `Paths.RepoStatusDir` 아래 `repo-state-{APP_VERSION}-{yyyyMMdd-HHmmss}.txt`

기존 파일은 덮어쓰지 않고 이름 충돌 시 timestamp/counter를 붙입니다. ZIP은 patch flat 구조가 아니라 원래 디렉터리 구조를 유지한 전체 소스 ZIP입니다. 파일 후보 목록은 `git ls-files -co --exclude-standard` 기준으로 만들며, tracked 수정 파일과 안전한 untracked 파일을 포함합니다.

ZIP 제외 규칙:

- 경로 세그먼트가 `.git`, `node_modules`, `.next`, `.wrangler`, `artifacts`, `.tmp`, `test-results`, `playwright-report`인 모든 중첩 디렉터리
- `.env`, `.env.*` (`.env.example`은 포함)
- 생성된 ZIP, 기존 `repo-state-*.txt`
- backup/temp/copy 파일과 OS 임시 파일

ZIP에는 source, docs, tests, tools, canonical PowerShell, `package.json`/lockfiles, public assets, Cloudflare Worker source와 공개 example 설정을 포함합니다. ZIP 후보에 실제 secret/token 파일명 또는 내용이 의심되면 ZIP 생성을 중단하고 경로만 보고합니다. secret 값 자체는 출력하지 않습니다.

생성 후에는 ZIP 내부 contract 검증도 실행합니다. 이 검증은 생성 시 제외 함수와 별도로 중첩 `node_modules`, `.next`, `.wrangler`, `.env.local`, `.git`, 생성 ZIP, 기존 repo-state 제외와 `.env.example` 및 필수 파일 포함을 확인합니다.

완료 시 콘솔에 ZIP 전체 경로, repo-state 전체 경로, ZIP 크기, APP_VERSION, Git clean 여부, ChatGPT에 업로드할 두 파일명을 출력합니다.

## 안전 검증 wrapper

`approved-workflow.ps1` is the preferred fixed approval entry point for repeat Codex automation. It accepts only four actions and does not evaluate user input as PowerShell code.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Verify -Profile automation-infrastructure
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Handoff
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Plan -Profile automation-infrastructure -CommitMessage "chore: add approved workflow entry point" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\approved-workflow.ps1 -Action Finish -Profile automation-infrastructure -CommitMessage "chore: add approved workflow entry point" -ExpectedAppVersion "0.24.11"
```

Actions:

- `Verify`: delegates to `verify-safe.ps1` with an allowlisted profile and writes a verification result path.
- `Handoff`: delegates to `peacebypiece-auto-pipeline.ps1 -CreateLocalRepoHandoff`; no build or Git write.
- `Plan`: gathers normalized explicit paths, computes the current working tree fingerprint, selects the newest matching PASS verification result, and reports whether Finish can run.
- `Finish`: repeats the same checks, selects the matching PASS result, then delegates to `finish-version.ps1 -Execute` with explicit paths.

`approved-workflow.ps1` blocks arbitrary actions, arbitrary script paths, non-allowlisted profiles, missing verification results, CheckOnly results, stale or mismatched fingerprints, non-`master` Finish, package/lockfile changes, DB migration changes, secret/production value candidates, and unexpected changed files. It does not run `Invoke-Expression`, `cmd /c`, `git add .`, `git add -A`, force push, amend, reset, clean, checkout, rebase, merge, dependency install, DB/R2 mutation, Seed, Reset, Cleanup, Migration, or production access.

`verify-safe.ps1`은 버전 작업 후 안전 검증을 한 번에 실행하는 wrapper입니다. Git add/commit/push, DB/R2 mutation, Seed/Reset/Cleanup/Migration, dependency 설치, 파일 삭제, production write를 수행하지 않습니다.

현재 주요 프로필:

```powershell
.\tools\pipeline\verify-safe.ps1 -Profile system-admin-storage
.\tools\pipeline\verify-safe.ps1 -Profile id-control-roadmap
.\tools\pipeline\verify-safe.ps1 -Profile automation-infrastructure
```

이 프로필은 공통 검증인 `git diff --check`, PowerShell parse check, package/lockfile 변경 확인, secret/production 값 검사, DB migration 변경 확인, `npm run build`, `npm run audit:wafl-mutations`와 다음 contract tests를 실행합니다.

- `node tests/system-storage-usage-real-data-contract.mjs`
- `node tests/system-dashboard-real-data-contract.mjs`
- `node tests/system-billing-real-data-contract.mjs`
- `node tests/dev-test-context-system-admin-contract.mjs`

`id-control-roadmap` 프로필은 `/id-control`, `/roadmap`, redirect, system-admin guard, production block, roadmap read-only, roadmap data rendering, roadmap Korean label contract를 explicit allowlist로 확인합니다.

- `node tests/internal-system-routes-contract.mjs`
- `node tests/dev-test-context-system-admin-contract.mjs`
- `node tests/simulator-onboarding-fixture-contract.mjs`

`automation-infrastructure` 프로필은 승인 자동화 wrapper, PowerShell parse, repo-state publication contract, build, mutation audit, package/lockfile 차단, migration 차단, secret/production scan을 확인합니다.

- `node tests/approved-workflow-contract.mjs`
- `node tests/pipeline-repo-state-publication-contract.mjs`

명령 계획과 안전 가드만 확인하려면:

```powershell
.\tools\pipeline\verify-safe.ps1 -Profile system-admin-storage -CheckOnly
.\tools\pipeline\verify-safe.ps1 -Profile id-control-roadmap -CheckOnly
.\tools\pipeline\verify-safe.ps1 -Profile automation-infrastructure -CheckOnly
```

검증 결과 파일은 `Paths.RepoStatusDir` 아래 `verify-safe-{profile}-{yyyyMMdd-HHmmss}.txt`로 생성됩니다. `VERIFY_SAFE_RESULT: PASS`가 있어야 Git 완료 wrapper의 실행 근거로 사용할 수 있습니다. `-CheckOnly`는 실제 검증 PASS가 아니며 commit/push 근거로 사용할 수 없습니다.

검증 결과에는 branch, HEAD hash, profile, 변경 파일 목록, 변경 내용 fingerprint, 실행 시각, PASS/FAIL, 실행 명령, Mutation Audit finding 수, high-risk 수가 기록됩니다. 같은 working tree에서는 이 결과를 재사용하며, 최종 보고를 위해 Mutation Audit을 다시 실행하지 않습니다.

## Git 완료 wrapper

`finish-version.ps1`은 개별 `git add`, `git commit`, `git push` 대신 명시 경로 allowlist로 Git 완료를 묶는 lower-level wrapper입니다. 일반 작업에서는 `approved-workflow.ps1 -Action Plan/Finish`를 먼저 사용합니다. 기본은 plan mode라 Git write가 없습니다.

Plan mode:

```powershell
.\tools\pipeline\finish-version.ps1 `
  -CommitMessage "chore: update pipeline automation" `
  -Paths AGENTS.md,tools/pipeline/README.md,tools/pipeline/peacebypiece-auto-pipeline.ps1,tools/pipeline/verify-safe.ps1,tools/pipeline/finish-version.ps1 `
  -ExpectedAppVersion 0.24.10
```

실제 Git 완료:

```powershell
.\tools\pipeline\finish-version.ps1 `
  -CommitMessage "chore: update pipeline automation" `
  -Paths AGENTS.md,tools/pipeline/README.md,tools/pipeline/peacebypiece-auto-pipeline.ps1,tools/pipeline/verify-safe.ps1,tools/pipeline/finish-version.ps1 `
  -ExpectedAppVersion 0.24.10 `
  -VerificationProfile system-admin-storage `
  -VerificationResultPath "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\Repo_Status\verify-safe-system-admin-storage-YYYYMMDD-HHMMSS.txt" `
  -Execute
```

`finish-version.ps1`은 repository path, `master` branch, `origin/master` 조회와 ahead/behind 0/0, 예상 변경 파일, package/lockfile 변경 없음, secret/production 값 없음, DB migration 변경 없음, verification result PASS, profile 일치, HEAD 일치, explicit path 일치, 변경 fingerprint 일치, `git diff --check`, `git diff --cached --check`, staged file list, ordinary commit, `git push origin master`, push 후 clean 상태를 확인합니다. force push, amend, reset, clean, checkout, rebase, merge, stash drop, 대량 삭제, 예상 밖 stage는 수행하지 않습니다.

`id-control-roadmap` 작업의 Git 완료 예:

```powershell
.\tools\pipeline\finish-version.ps1 `
  -CommitMessage "feat: add Korean system admin roadmap page" `
  -Paths AGENTS.md,app/roadmap/page.tsx,docs/codex-current-state.md,docs/productization-roadmap.md,lib/constants/version.ts,lib/internal/productizationRoadmap.ts,tests/internal-system-routes-contract.mjs,tools/pipeline/README.md,tools/pipeline/finish-version.ps1,tools/pipeline/verify-safe.ps1 `
  -ExpectedAppVersion 0.24.11 `
  -VerificationProfile id-control-roadmap `
  -VerificationResultPath "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\Repo_Status\verify-safe-id-control-roadmap-YYYYMMDD-HHMMSS.txt" `
  -Execute
```

## Roadmap 운영 규칙

`/roadmap`은 시스템 관리자 전용 조회 화면입니다. 사용자 표시 문구는 한글을 기본으로 하고, 편집/추가/삭제/저장/drag-and-drop/inline edit/localStorage canonical source/URL query mutation을 추가하지 않습니다.

로드맵 계획을 바꿀 때는 다음 두 파일을 함께 갱신합니다.

- `lib/internal/productizationRoadmap.ts`
- `docs/productization-roadmap.md`

## 승인 범위

항상 승인 가능한 후보는 정확한 read/validation-only 명령으로 한정합니다.

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\peacebypiece-auto-pipeline.ps1 -CreateLocalRepoHandoff`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\verify-safe.ps1 -Profile system-admin-storage`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\verify-safe.ps1 -Profile system-admin-storage -CheckOnly`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pipeline\finish-version.ps1 ...` without `-Execute`

개별 승인 또는 버전당 한 번의 명시 승인이 필요한 범위:

- `finish-version.ps1 ... -Execute`는 Git write이므로 실행 전 조건과 경로 allowlist를 확인해야 합니다.
- Seed/Reset/Cleanup/Migration execute, DB/R2 mutation, production access, dependency install/update, lockfile change, destructive cleanup은 wrapper와 무관하게 별도 명시 승인이 필요합니다.

항상 승인하면 안 되는 broad prefix:

- 전체 `powershell`
- 전체 `node`
- 전체 `npm`
- 전체 `npm run`
- 전체 `git`
- destructive command를 포함할 수 있는 포괄 prefix

Separate PowerShell uploads are not needed when Git already carries the current canonical script. Use an external PowerShell upload only when a newer script-only copy exists outside the repository or when a task explicitly asks for script-only handoff.
