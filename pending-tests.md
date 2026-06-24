# Pending Tests — 0.24.21.8

## 자동 검증

- [ ] `node tests/unicode-encoding-contract.mjs`
- [ ] `node tests/pipeline-powershell-encoding-contract.mjs`
- [ ] `node tests/pipeline-repo-state-publication-contract.mjs`
- [ ] `roadmap-development-contract`
- [ ] `tsc --noEmit`
- [ ] `next build`

## 한글 / Unicode 실검증

- [ ] GitHub에서 `docs/현재기준`, `docs/정책문서`, `docs/보관문서` 경로가 정상 표시된다.
- [ ] Windows PowerShell에서 canonical pipeline 한글 메뉴가 정상 표시된다.
- [ ] 전체 소스 ZIP을 Windows에서 해제했을 때 한글 파일명과 폴더명이 정상이다.
- [ ] Flat Patch ZIP 내부의 한글 entry name이 정상이다.
- [ ] VS Code에서 Markdown, SQL, TypeScript 한글 본문이 정상이다.

## 회귀 방지

- [ ] 일반 text 파일은 UTF-8로 decode된다.
- [ ] U+FFFD replacement character가 없다.
- [ ] canonical PowerShell은 UTF-8 BOM을 유지한다.
- [ ] 한글 경로를 임의로 영문 rename하지 않았다.
- [ ] package와 lockfile을 변경하지 않았다.
- [ ] DB/R2/Seed/Reset/Cleanup/Migration을 실행하지 않았다.
