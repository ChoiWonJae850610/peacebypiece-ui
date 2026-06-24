# Pending Tests — 0.24.21.7

## 자동 검증

- [ ] `node tests/pipeline-powershell-encoding-contract.mjs`
- [ ] `node tests/pipeline-repo-state-publication-contract.mjs`
- [ ] `roadmap-development-contract`
- [ ] `tsc --noEmit`
- [ ] `next build`

## Windows PowerShell 실검증

- [ ] `tools/pipeline/peacebypiece-auto-pipeline.ps1`을 Windows PowerShell에서 실행한다.
- [ ] 482, 567, 569, 707행 주변 parser 오류가 발생하지 않는다.
- [ ] 한글 메뉴·안내 문구가 깨지지 않는다.
- [ ] menu 7로 전체 소스 ZIP과 repo-state를 생성한다.
- [ ] 0.24.21.6의 generated-output 제외 계약이 유지된다.

## 회귀 방지

- [ ] secret 후보 탐지 정규식이 유지된다.
- [ ] verification result의 Passed/Command/FindingCount/HighRiskCount 파싱이 유지된다.
- [ ] package와 lockfile이 변경되지 않았다.
- [ ] DB/R2/Seed/Reset/Cleanup/Migration을 실행하지 않았다.
- [ ] UI/API/route runtime 동작을 변경하지 않았다.
