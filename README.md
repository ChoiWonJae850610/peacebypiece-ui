# WAFL / PeaceByPiece UI

- 기준 앱 버전: `0.24.11`
- 프로젝트 성격: 의류 생산, 작업지시서, 원단/부자재 발주, 고객사 운영을 관리하는 WAFL 웹 UI
- 현재 작업 상태: repository cleanup 1차. 기능 개발과 `0.24.12` 시작은 별도 작업에서 진행한다.

## 개발 실행

```bash
npm run dev
```

로컬 실행 후 브라우저에서 `http://localhost:3000`을 연다.

## 검증

일반 패치 검증은 변경 범위에 맞는 `tools/pipeline/verify-safe.ps1` profile을 우선 사용한다.

```powershell
powershell -ExecutionPolicy Bypass -File tools/pipeline/verify-safe.ps1 -Profile repository-cleanup
```

버전 작업을 마무리할 때는 검증 결과를 재사용해 `tools/pipeline/finish-version.ps1`로 explicit path만 stage/commit/push한다. `git add .`, force push, reset, clean, checkout은 사용하지 않는다.

## 주요 문서

- 문서 인덱스: `docs/README.md`
- 현재 기준 문서: `docs/현재기준/`
- 정책 문서: `docs/정책문서/`
- 보관 문서: `docs/보관문서/`
- 정리/감사 문서: `docs/audits/`
- 현재 상태: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- 누적 테스트 항목: `pending-tests.md`

## 현재 기준

- 앱 표시 버전은 `lib/constants/version.ts`의 `APP_VERSION`을 기준으로 한다. `package.json`의 `version`은 npm package metadata다.
- `docs/`에는 tracked 문서 668개가 있으며, 루트 문서가 307개라 다음 cleanup에서 archive manifest 기준으로 정리한다.
- `docs/현재기준/`과 `docs/productization-roadmap.md`가 현재 개발 판단의 우선 기준이다.
- `/id-control`은 내부 identity-control console의 현재 경로다. `/dev/test-console`은 production 차단과 명시 enable guard를 유지한다.
- `/roadmap`은 system administrator 전용 read-only 화면이다. edit/save/delete, DB/R2 write, URL/query/localStorage mutation은 별도 정책 결정 없이는 추가하지 않는다.

## DB 보조 파일

- `db/schema/full_reset.sql`은 개발 DB 전체 초기화 기준 schema다. 운영 DB에서 직접 실행하지 않는다.
- `db/schema/full_reset_smoke_test.sql`은 full reset 후 핵심 schema 검증용이다.
- `db/migrations/*`는 기존 DB 보정과 감사 이력을 위해 유지한다. `full_reset.sql`에 반영된 항목도 자동 삭제하거나 archive 이동하지 않는다.
- `db/seed/system_standards_seed.sql`은 기존 DB를 유지하면서 시스템 기준정보 seed를 보강할 때 사용하는 canonical seed SQL이다.
- 실제 DB/R2/Seed/Reset/Cleanup/Migration 실행은 명시 승인 후에만 진행한다.

## Cloudflare Worker

- `cloudflare/r2-upload-worker.js`는 R2 업로드/다운로드/삭제 요청 중계 Worker 기준 파일이다.
- `cloudflare/pdf-generator-worker/`는 PDF Generator Worker의 Wrangler 배포 기준 폴더다.
- `cloudflare/pdf-generator-worker.js`와 `cloudflare/pdf-generator-worker.wrangler.example.toml`은 deprecated 단일 파일/예시 설정이다. 이번 cleanup에서는 유지하고, deploy/CI 참조 분석 후 별도 결정한다.

## 작업 안전 규칙

- `.env.local`, 실제 DB/R2 URL, 토큰, secret key는 출력하거나 Git에 포함하지 않는다.
- `pnpm-lock.yaml`, `package-lock.json`, dependency metadata는 명시 승인 없이 변경하지 않는다.
- DB schema, migration, seed SQL, 인증/권한/정책/약관, tenant isolation은 별도 승인 없이 삭제·이동·완화하지 않는다.
- 대량 문서 이동은 `docs/audits/docs-archive-manifest-0.24.11.md` 같은 manifest와 사용자 승인 후 진행한다.
