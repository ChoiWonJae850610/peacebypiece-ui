# Pending Tests - 0.24.18

## 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `tools/pipeline/approved-workflow.ps1 -Action Verify -Profile roadmap-development-contract`
- [ ] `tools/pipeline/approved-workflow.ps1 -Action Plan -Profile roadmap-development-contract -CommitMessage "docs: establish productization canonical standards" -ExpectedAppVersion "0.24.18"`
- [ ] `tools/pipeline/approved-workflow.ps1 -Action Finish -Profile roadmap-development-contract -CommitMessage "docs: establish productization canonical standards" -ExpectedAppVersion "0.24.18"`

## 수동 확인

- [ ] 네 canonical 문서의 제품 원칙, 역할 분담, release blocking 상태가 실제 운영 판단과 일치하는지 검토한다.
- [ ] `/roadmap`에서 현재 버전 0.24.18, 다음 버전 0.24.19, 제품화 진척도 86%가 정상 표시되는지 확인한다.
- [ ] README와 docs index의 새 문서 경로가 정상적으로 열리는지 확인한다.

## 이번 버전에서 의도적으로 실행하지 않는 항목

- DB/R2/Seed/Reset/Cleanup/Migration 실행 없음.
- runtime, permission, API, UI behavior 변경 없음.
- dependency, package metadata, lockfile 변경 없음.
