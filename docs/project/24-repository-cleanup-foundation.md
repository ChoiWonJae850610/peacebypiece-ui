# Repository Cleanup Foundation

Version: 0.24.21.6  
Status: cleanup evidence and execution boundary  
Runtime feature implementation: 없음

## 1. 목적

0.24.21.5 전체 소스 ZIP과 repository 구조를 기준으로 생성 산출물, 빈 폴더, 문서 구조, 대형 파일, package manager, orphan 후보를 정리한다. 이번 버전은 증거가 명확한 handoff ZIP 제외 계약만 보강하고, 대량 삭제·이동·소스 분해는 Codex Cleanup Sprint로 넘긴다.

## 2. 확인된 사실

- GitHub의 한글 경로는 정상이다.
- ChatGPT 분석 환경에서 보인 깨진 한글 경로는 ZIP entry decoding 표시 문제다.
- 한글 폴더 rename이나 인코딩 수정은 금지한다.
- 전달 ZIP에는 `artifacts/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`가 포함돼 있었다.
- `.gitignore`와 pipeline 설명은 이 생성물을 제외 대상으로 정의하고 있었다.
- canonical handoff 함수에도 일부 제외 검사가 이미 있었으나, `reports/`와 `*.tsbuildinfo`가 완전한 contract 항목으로 고정돼 있지 않았다.

## 3. 이번 저위험 보강

전체 소스 ZIP에서 다음을 제외한다.

- `.git/`
- `node_modules/`
- `.next/`
- `.wrangler/`
- `artifacts/`
- `.tmp/`
- `test-results/`
- `playwright-report/`
- `reports/`
- `*.tsbuildinfo`
- `.env`, `.env.*` (`.env.example` 제외)
- 생성 ZIP, repo-state, build-result
- backup/temp/copy 파일

ZIP 생성 전 후보 필터와 생성 후 contract 검사 양쪽에 동일 규칙을 둔다. repo-state의 Exclude Rule Summary에도 `reports`와 `*.tsbuildinfo`를 표시한다.

## 4. 한글 경로 정책

- 저장소의 정상 한글 경로를 rename하지 않는다.
- ZIP 생성 시 entry name을 원본 Git 경로 그대로 유지한다.
- `core.quotepath=false`와 PowerShell UTF-8 출력 정책을 유지한다.
- ChatGPT/Linux 분석 환경의 mojibake 표시는 repository 결함으로 취급하지 않는다.
- 실제 rename은 GitHub와 로컬 Git에서 모두 깨졌다는 증거가 있을 때만 별도 승인한다.

## 5. Cleanup 분류

### P0 — handoff 생성물

이번 버전에서 pipeline contract를 보강한다.

- artifacts
- playwright-report
- test-results
- reports
- tsbuildinfo
- wrangler local state

### P1 — Codex 조사 후 정리

- 빈 route·placeholder 폴더
- 문서 root/history/archive 재분류
- npm/pnpm canonical 결정
- 대형 UI·repository·i18n 파일 분해
- import graph 기반 orphan 파일

### P2 — 기능 Sprint 이후

- WorkOrderDrawingCanvasEditor 분해
- WorkOrder route handler 분해
- feature-first 경계 확대
- 관리자 대형 console 분해

## 6. 빈 폴더 정책

빈 폴더는 Git이 추적하지 않으므로 로컬 전달 ZIP에서 보인 것만으로 삭제 commit 대상이 아니다. 다음을 확인한다.

1. `.gitkeep` 또는 tracked 파일 존재 여부
2. Next.js route 예정 경로 여부
3. docs/PB에서 구현 예정으로 참조하는지
4. PowerShell·Playwright·Simulator가 경로 자체를 사용하는지

증거 없이 placeholder folder를 만들거나 삭제하지 않는다.

## 7. 문서 cleanup 정책

- `docs/project/`: 현재 canonical 제품화 문서
- `docs/현재기준/`: 현재 도메인·업무 기준
- `docs/정책문서/`: 정책·법무·보관 기준
- `docs/보관문서/`: 버전 이력과 대체된 설계
- `docs/audits/`: 감사와 cleanup 근거

문서 이동은 링크, README index, Codex 검색 정책을 함께 수정하는 별도 Sprint로 처리한다. exact duplicate나 canonical에 흡수된 일회성 결과 기록만 삭제 후보가 된다.

## 8. package manager 결정

루트에 `package-lock.json`과 `pnpm-lock.yaml`이 동시에 있다. 현재 scripts와 pipeline은 npm 중심이지만, Vercel/CI 설정을 확인하기 전에는 어느 lockfile도 삭제하지 않는다.

결정 절차:

1. Vercel install command 확인
2. CI workflow 확인
3. 최근 lockfile commit 이력 확인
4. 로컬 표준 명령 확인
5. canonical package manager 결정
6. 다른 lockfile 제거와 `packageManager` 필드 추가를 별도 승인

## 9. 대형 파일 리팩터링 경계

다음은 Codex Cleanup Sprint 후보이며 GPT 수동 패치로 분해하지 않는다.

- `app/ui/WaflUiCatalogPage.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `lib/invitations/joinRequestRepository.ts`
- `lib/i18n/ko/admin.ts`
- `lib/i18n/en/admin.ts`
- `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`
- `lib/workorder/api/workOrderRouteHandlers.ts`

분해 전 import graph, dynamic import, barrel export, route/test 참조를 확인한다.

## 10. 완료 조건

- handoff ZIP 후보 필터가 `reports`와 `*.tsbuildinfo`를 제외한다.
- 생성 후 ZIP contract도 동일 항목을 차단한다.
- repo-state exclude summary에 규칙이 보인다.
- 기존 필수 파일과 `.env.example` 포함 계약이 유지된다.
- GitHub의 정상 한글 경로를 변경하지 않는다.
- package/lockfile, DB, R2, runtime UI는 변경하지 않는다.
