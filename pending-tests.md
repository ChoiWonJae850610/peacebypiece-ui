# Pending Tests - 0.24.17

## 자동 검증

- [x] `tsc --noEmit`
- [x] `next build` via `node_modules/.bin/next.cmd build`
- [x] `tools/pipeline/approved-workflow.ps1 -Action Verify -Profile roadmap-development-contract`
- [x] `tools/pipeline/approved-workflow.ps1 -Action Plan -Profile roadmap-development-contract -CommitMessage "refactor: apply productization cleanup sprint" -ExpectedAppVersion "0.24.17"`
- [x] `tools/pipeline/approved-workflow.ps1 -Action Finish -Profile roadmap-development-contract -CommitMessage "refactor: apply productization cleanup sprint" -ExpectedAppVersion "0.24.17"`

## 수동 확인

- [ ] `/workspace/materials`에서 원단 또는 부자재 목록이 비어 있을 때 `AdminEmptyState` 기반 빈 상태가 과도하게 커지거나 주변 테이블/카드와 겹치지 않는지 확인한다.
- [ ] `/ui`에서 WAFL UI 카탈로그가 이전과 동일하게 렌더링되고 섹션 anchor 이동이 유지되는지 확인한다.
- [ ] `/workspace/settings`에서 설정 허브 탭, 요금/계정/약관/피드백 패널이 이전과 동일하게 열리고 저장/요청 동작이 유지되는지 확인한다.

## 이번 버전에서 의도적으로 실행하지 않는 항목

- DB/R2/Seed/Reset/Cleanup/Migration 실행 없음.
- dependency install, package metadata 변경, lockfile 변경 없음.
- Runtime gate, permission policy, API contract 변경 없음.
