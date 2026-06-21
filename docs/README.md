# WAFL / PeaceByPiece Docs Index

- 기준 앱 버전: `0.24.16`
- tracked docs 파일 수: `661`
- docs root 파일 수: `181`
- 정리 기준: root에는 최소 진입점만 두고, 현재 판단은 `docs/codex-current-state.md`, `docs/project/`, `docs/현재기준/`, `docs/productization-roadmap.md`를 우선한다.

## 1. 현재 기준 문서

현재 개발, 검증, 운영 판단에서 먼저 확인할 문서는 `docs/현재기준/`에 둔다.

- `docs/현재기준/README.md`
- `docs/현재기준/document-management.md`
- `docs/현재기준/testing-and-automation.md`
- `docs/현재기준/simulator.md`
- `docs/현재기준/wafl-ui-system.md`
- `docs/현재기준/요금-저장소-정책-설계.md`
- `docs/현재기준/workorder.md`
- `docs/현재기준/material-order.md`
- `docs/현재기준/modal-and-focus.md`
- 작업지시서 상태 구조
- 원단/부자재 데이터베이스 설계
- 원단/부자재 발주 설계
- 워크스페이스 경계
- 데이터베이스 구조와 쿼리/인덱스 정책

## 2. 운영 기준 문서

- 현재 상태: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- 제품화 백로그: `docs/productization-backlog.md`
- 제품화 감사 보고서: `docs/audits/productization-audit-report-0.24.15.md`
- Codex/GPT 제품화 운영 문서: `docs/project/`
- Codex Context: `docs/project/01-codex-context.md`
- Project Decisions: `docs/project/02-project-decisions.md`
- Productization Guide: `docs/project/03-productization.md`
- Release Checklist: `docs/project/04-release-checklist.md`
- cleanup inventory: `docs/audits/repository-cleanup-inventory-0.24.11.md`
- docs archive manifest: `docs/audits/docs-archive-manifest-0.24.11.md`
- document structure cleanup audit: `docs/audits/document-structure-cleanup-0.24.13.md`
- PowerShell pipeline guide: `tools/pipeline/README.md`

## 3. 정책 문서

서비스 약관, 개인정보처리방침, 요금, 저장소, 데이터 보관 정책은 `docs/정책문서/`에 둔다. 정책/법무/권한 문서는 cleanup 중 자동 삭제하지 않는다.

## 4. 보관 문서

과거 설계 기록, 완료 기능 이력, QA 기록은 `docs/보관문서/`에 둔다.

- `docs/보관문서/completed-features/`
- `docs/보관문서/completed-features/workorder/`
- `docs/보관문서/completed-features/material-order/`
- `docs/보관문서/qa-history/`
- `docs/보관문서/qa-history/modal/`
- `docs/보관문서/versions/`
- `docs/보관문서/deprecated/`

## 5. 현재 통계

| 영역 | 파일 수 |
| --- | ---: |
| docs root | 181 |
| docs/보관문서 | 400 |
| docs/정책문서 | 32 |
| docs/현재기준 | 34 |
| docs/audits | 13 |
| docs/project | 4 |

## 6. 정리 원칙

- build-fix, Playwright 초기 구축, simulator 작은 수정, WAFL UI catalog, pipeline version 문서는 1차에서 병합/보관/삭제했다.
- workorder, material-order, modal/focus 주요 이력과 초기 모바일/QA 기록은 2차에서 병합/보관/삭제했다.
- billing/storage, responsive/device/layout, DB smoke 이력은 3차에서 현재 기준 문서로 병합하고 보관했다.
- 현재 manifest로 대체되는 0.19.94대 일회성 문서 cleanup 결과 기록 6개는 3차에서 삭제했다.
- 0.24.11 대규모 문서 cleanup은 3차로 종료한다. 남은 문서는 현재 기준 문서, 보호 문서, 또는 후속 필요 시 개별 정리 대상으로만 다룬다.
- exact duplicate와 일회성 결과 기록은 canonical 반영, 참조 0건, 정책/DB/권한/PDF 핵심 아님을 확인한 뒤 삭제한다.
- DB/migration/lockfile/auth/permission/policy/legal/Cloudflare deploy 파일은 사용자 승인 없이 삭제하지 않는다.


## 7. Codex 검색 정책

현재 구현·정책 판단을 할 때는 `docs/보관문서/**`, `docs/**/legacy/**`, `docs/**/deprecated/**`를 기본 제외한다. 과거 회귀 원인이나 삭제 근거를 확인해야 할 때만 보관 문서를 검색한다.

작업 시작 순서는 `AGENTS.md` → `docs/codex-current-state.md` → `docs/project/` → 해당 `lib/internal/roadmap/roadmap-*.ts` → `docs/현재기준/` 관련 문서 → 필요한 경우 `docs/audits/` 순서다.

## 8. Vercel QA 흐름

1. local/build/contract 검증을 통과한다.
2. 1.0 전까지는 `master`에 commit/push한다.
3. Vercel 배포본을 운영이 아니라 실기기 QA 환경으로 본다.
4. iPad, Galaxy Tab, mobile, PC에서 수동 확인한다.
5. 문제는 같은 버전 보완 또는 다음 버전 패치로 처리한다.

## 9. 검증

repository cleanup 변경은 승인 자동화 wrapper를 사용한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile repository-cleanup
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Plan -Profile repository-cleanup -CommitMessage "docs: consolidate billing storage and legacy QA history" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Finish -Profile repository-cleanup -CommitMessage "docs: consolidate billing storage and legacy QA history" -ExpectedAppVersion "0.24.11"
```
