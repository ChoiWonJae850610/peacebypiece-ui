# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.24.28`
- 현재 작업: `0.24.28` PDF and R2 Lifecycle
- 제품 성격: 의류 생산, 작업지시서, 원단/부자재 발주, 고객사 운영을 관리하는 WAFL UI

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 엽니다.

## 검증

변경 범위에 맞는 `tools/pipeline/approved-workflow.ps1 -Action Verify` profile을 우선 사용합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify
```

버전 작업 마감은 wrapper의 Plan/Finish 흐름을 우선 사용합니다. `git add .`, force push, reset, clean, checkout은 사용하지 않습니다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- Codex 현재 상태: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- 제품화 백로그: `docs/productization-backlog.md`
- 현재 기준 문서: `docs/현재기준/document-management.md`
- 최종 정책 문서: `docs/project/26-final-policy-decisions-and-master-todo.md`
- 통합 마스터 플랜: `docs/project/31-pre-codex-integrated-master-plan.md`
- structured roadmap source: `lib/internal/roadmap/`

## 운영 기준

- 앱 표시 버전은 `lib/constants/version.ts`의 `APP_VERSION`을 기준으로 합니다.
- `package.json`의 `version`은 npm package metadata입니다.
- Vercel 배포본은 고객 운영 환경일 수 있으므로 DB/R2/Seed/Reset/Cleanup/Migration/production mutation은 별도 승인 없이는 실행하지 않습니다.
- `/id-control`, `/roadmap`, `/ui`, `/functions`는 active system-admin 전용 내부 read/view 화면입니다.
