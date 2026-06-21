# WAFL / PeaceByPiece Docs Index

- 기준 앱 버전: `0.24.11`
- tracked docs 파일 수: `656`
- docs root 파일 수: `180`
- 정리 기준: root에는 현재 기준 문서, 최신 audit, roadmap, 운영 handoff만 남기고 버전별 완료 기록은 canonical 병합 후 archive 또는 삭제한다.

## 1. 현재 기준 문서

현재 개발, 검증, 운영 판단에서 먼저 확인할 문서는 `docs/현재기준/`에 둔다.

- `docs/현재기준/README.md`
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
- cleanup inventory: `docs/audits/repository-cleanup-inventory-0.24.11.md`
- docs archive manifest: `docs/audits/docs-archive-manifest-0.24.11.md`
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
| docs root | 180 |
| docs/보관문서 | 400 |
| docs/정책문서 | 32 |
| docs/현재기준 | 34 |
| docs/audits | 10 |

## 6. 정리 원칙

- build-fix, Playwright 초기 구축, simulator 작은 수정, WAFL UI catalog, pipeline version 문서는 1차에서 병합/보관/삭제했다.
- workorder, material-order, modal/focus 주요 이력과 초기 모바일/QA 기록은 2차에서 병합/보관/삭제했다.
- billing/storage, responsive/device/layout, DB smoke 이력은 3차에서 현재 기준 문서로 병합하고 보관했다.
- 현재 manifest로 대체되는 0.19.94대 일회성 문서 cleanup 결과 기록 6개는 3차에서 삭제했다.
- 0.24.11 대규모 문서 cleanup은 3차로 종료한다. 남은 문서는 현재 기준 문서, 보호 문서, 또는 후속 필요 시 개별 정리 대상으로만 다룬다.
- exact duplicate와 일회성 결과 기록은 canonical 반영, 참조 0건, 정책/DB/권한/PDF 핵심 아님을 확인한 뒤 삭제한다.
- DB/migration/lockfile/auth/permission/policy/legal/Cloudflare deploy 파일은 사용자 승인 없이 삭제하지 않는다.

## 7. 검증

repository cleanup 변경은 승인 자동화 wrapper를 사용한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile repository-cleanup
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Plan -Profile repository-cleanup -CommitMessage "docs: consolidate billing storage and legacy QA history" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Finish -Profile repository-cleanup -CommitMessage "docs: consolidate billing storage and legacy QA history" -ExpectedAppVersion "0.24.11"
```
