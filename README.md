# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.24.25.3`
- 프로젝트 성격: 의류 생산, 작업지시서, 원단/부자재 발주, 고객사 운영을 관리하는 WAFL UI
- 현재 작업 상태: `0.24.25.3`은 `/id-control` account impersonation을 active system-admin에게 runtime/env와 무관하게 허용하는 보정 버전입니다. 다음 공식 작업은 `0.24.26` Public Signup, Verification, Approval, and Trial입니다.

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 엽니다.

## 검증

변경 범위에 맞는 `tools/pipeline/approved-workflow.ps1 -Action Verify` profile을 우선 사용합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile functions-automation
```

버전 작업을 마무리할 때는 `approved-workflow.ps1 -Action Plan`과 `approved-workflow.ps1 -Action Finish`를 사용합니다. wrapper가 matching PASS verification result와 changed fingerprint를 확인하고 explicit path만 stage/commit/push합니다. `git add .`, force push, reset, clean, checkout은 사용하지 않습니다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- Codex 작업 시작 매니페스트: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- 제품화 백로그: `docs/productization-backlog.md`
- 제품화 감사 보고서: `docs/audits/productization-audit-report-0.24.15.md`
- 0.24.23 source cleanup 감사: `docs/audits/source-architecture-cleanup-0.24.23.md`
- 0.24.24.1 simulator attachment/R2 감사: `docs/audits/simulator-attachment-r2-lifecycle-0.24.24.1.md`
- Codex/GPT 제품화 운영 문서: `docs/project/`
- 현재 structured roadmap source: `lib/internal/roadmap/`

## 현재 기준

- 앱 표시 버전은 `lib/constants/version.ts`의 `APP_VERSION`을 기준으로 합니다.
- `package.json`의 `version`은 npm package metadata입니다.
- `docs/codex-current-state.md`와 `lib/internal/roadmap/`을 우선 읽고, 오래된 Sprint 문서는 historical reference로만 봅니다.
- `/id-control`, `/roadmap`, `/ui`, `/functions`는 system administrator 전용 내부 read/view 화면입니다.
- DB/R2/Seed/Reset/Cleanup/Migration/production mutation은 별도 승인 없이는 실행하지 않습니다.
