# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.24.21.4`
- 프로젝트 성격: 의류 생산, 작업지시서, 원단/부자재 발주, 고객사 운영을 관리하는 WAFL UI
- 현재 작업 상태: `0.24.21.4`는 저장공간 원통형 UI, 대표 이미지·사업자등록증 파일 상태, 작업지시서 opaque URL 식별자와 deep-link 계약을 Codex 구현 입력으로 확정한다.

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 연다.

## 검증

일반 패치 검증은 변경 범위에 맞는 `tools/pipeline/approved-workflow.ps1 -Action Verify` profile을 우선 사용한다. 작업 유형별 먼저 읽을 파일과 profile 선택 기준은 `docs/codex-current-state.md`를 따른다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile functions-automation
```

버전 작업을 마무리할 때는 `approved-workflow.ps1 -Action Plan` 후 `approved-workflow.ps1 -Action Finish`를 사용한다. wrapper가 matching PASS verification result와 changed fingerprint를 확인한 뒤 explicit path만 stage/commit/push한다. `git add .`, force push, reset, clean, checkout은 사용하지 않는다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- 현재 기준 문서: `docs/현재기준/`
- 문서 구조 기준: `docs/현재기준/document-management.md`
- 정책 문서: `docs/정책문서/`
- 보관 문서: `docs/보관문서/`
- 정리/감사 문서: `docs/audits/`
- Codex 작업 시작 매니페스트: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- 제품화 백로그: `docs/productization-backlog.md`
- 제품화 감사 보고서: `docs/audits/productization-audit-report-0.24.15.md`
- Codex/GPT 제품화 운영 문서: `docs/project/`
  - `docs/project/01-codex-context.md`
  - `docs/project/02-project-decisions.md`
  - `docs/project/03-productization.md`
  - `docs/project/04-release-checklist.md`
  - `docs/project/05-productization-bible.md`
  - `docs/project/06-architecture-guide.md`
  - `docs/project/07-wafl-component-standard.md`
  - `docs/project/08-release-readiness-matrix.md`
  - `docs/project/09-pdf-specification.md`
  - `docs/project/10-r2-storage-policy.md`
  - `docs/project/11-admin-operations-design.md`
  - `docs/project/12-release-engineering.md`
  - `docs/project/13-qa-matrix.md`
  - `docs/project/14-playwright-plan.md`
  - `docs/project/15-browser-device-matrix.md`
  - `docs/project/16-pb-breakdown.md`
  - `docs/project/17-codex-ready-queue.md`
  - `docs/project/18-sprint-queue.md`
  - `docs/project/19-system-default-catalog-and-seed-spec.md`
  - `docs/project/20-customer-signup-consent-approval-trial-spec.md`
  - `docs/project/21-public-website-commercial-onboarding-spec.md`
  - `docs/project/22-ui-routing-remediation-spec.md`
- 누적 테스트 항목: `pending-tests.md`

## 현재 기준

- 앱 표시 버전은 `lib/constants/version.ts`의 `APP_VERSION`을 기준으로 한다. `package.json`의 `version`은 npm package metadata다.
- `docs/`에는 tracked 문서 661개가 있으며 root에는 최소 진입점만 둔다. 0.24.13부터 현재 판단은 `docs/codex-current-state.md`와 `docs/현재기준/document-management.md`를 우선한다.
- `docs/codex-current-state.md`가 작업 유형별 진입 문서를 라우팅하고, 세부 기준은 `lib/internal/roadmap/`과 `docs/현재기준/`을 따른다.
- `/id-control`은 내부 identity-control console의 현재 경로다. `/dev/test-console`은 system_admin 정책 확인 후 `/id-control`로 이동하는 호환 경로다.
- `/roadmap`은 system administrator 전용 read-only 화면이다. edit/save/delete, DB/R2 write, URL/query/localStorage mutation은 별도 정책 결정 없이 추가하지 않는다.


## 1.0 전 QA 배포 흐름

- 1.0 전까지 `master`는 개발/QA 기준 브랜치다.
- Vercel 배포본은 고객 운영이 아니라 iPad, Galaxy Tab, mobile, PC 실기기 QA 환경으로 본다.
- local/build/contract 검증 후 commit/push하고, Vercel 배포에서 수동 확인한다.
- 문제가 발견되면 같은 버전 보완 또는 다음 버전 패치로 처리한다.

## DB 보조 파일

- `db/schema/full_reset.sql`은 개발 DB 전체 초기화 기준 schema다. 운영 DB에서 직접 실행하지 않는다.
- `db/schema/full_reset_smoke_test.sql`은 full reset 후 통합 schema 검증용이다.
- `db/migrations/*`는 기존 DB 보정과 감사 이력을 위해 유지한다. `full_reset.sql` 반영 항목도 자동 삭제하거나 archive 이동하지 않는다.
- `db/seed/system_standards_seed.sql`은 기준 DB를 유지하면서 시스템 기준정보 seed를 보강할 때 사용하는 canonical seed SQL이다.
- 실제 DB/R2/Seed/Reset/Cleanup/Migration 실행은 명시 승인 후에만 진행한다.

## Cloudflare Worker

- `cloudflare/r2-upload-worker.js`는 R2 업로드/다운로드/삭제 요청 중계 Worker 기준 파일이다.
- `cloudflare/pdf-generator-worker/`는 PDF Generator Worker의 Wrangler 배포 기준 폴더다.
- `cloudflare/pdf-generator-worker.js`와 `cloudflare/pdf-generator-worker.wrangler.example.toml`은 deprecated 단일 파일/예시 설정이다. cleanup 중 사용자 승인 없이 삭제하지 않는다.

## 작업 안전 규칙

- `.env.local`, 실제 DB/R2 URL, token, secret key를 출력하거나 Git에 포함하지 않는다.
- `pnpm-lock.yaml`, `package-lock.json`, dependency metadata는 명시 승인 없이 변경하지 않는다.
- DB schema, migration, seed SQL, 인증/권한/정책/법무, tenant isolation은 별도 승인 없이 삭제, 이동, 완화하지 않는다.
- 대량 문서 이동은 `docs/audits/docs-archive-manifest-0.24.11.md` 같은 manifest를 사용하고 승인된 범위 안에서 진행한다.
