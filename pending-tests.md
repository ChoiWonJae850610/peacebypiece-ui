# Pending Tests — 0.24.21.6

## 자동 검증

- [ ] `node tests/pipeline-repo-state-publication-contract.mjs`
- [ ] `roadmap-development-contract`
- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] Mutation Audit high-risk 0

## Handoff ZIP 실검증

- [ ] PowerShell 메뉴 7로 새 전체 소스 ZIP과 repo-state를 생성한다.
- [ ] ZIP에 `artifacts/`가 없다.
- [ ] ZIP에 `playwright-report/`가 없다.
- [ ] ZIP에 `test-results/`가 없다.
- [ ] ZIP에 `reports/`가 없다.
- [ ] ZIP에 `.wrangler/`가 없다.
- [ ] ZIP에 `*.tsbuildinfo`가 없다.
- [ ] `.env.example`은 포함되고 다른 `.env*`는 없다.
- [ ] repo-state Exclude Rule Summary에 `reports`와 `*.tsbuildinfo`가 표시된다.

## 회귀 방지

- [ ] GitHub의 한글 폴더·파일명이 변경되지 않았다.
- [ ] `package.json`, `package-lock.json`, `pnpm-lock.yaml`이 변경되지 않았다.
- [ ] DB/R2/Seed/Reset/Cleanup/Migration을 실행하지 않았다.
- [ ] UI/API/route runtime 동작을 변경하지 않았다.

## 후속 Cleanup Sprint

- [ ] 빈 폴더와 placeholder 경로를 tracked evidence로 재분류한다.
- [ ] import graph 기반 orphan audit를 수행한다.
- [ ] docs root/history/archive 이동안을 검증한다.
- [ ] npm/pnpm canonical package manager를 확인한다.
- [ ] 대형 파일 분해 우선순위를 Codex Sprint로 확정한다.
