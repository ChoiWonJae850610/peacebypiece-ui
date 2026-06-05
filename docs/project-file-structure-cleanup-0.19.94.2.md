# 프로젝트 파일 구조 정리 1차 (0.19.94.2)

## 목적

0.19.94.1 감사 결과를 기준으로 테스트가 어려운 기간에 기능 코드 변경 없이 확실한 생성 산출물과 미사용 정적 파일, 빈 폴더를 정리한다.

## 정리 원칙

- 기능 코드, API route, DB schema, R2 upload flow는 변경하지 않는다.
- Next.js route group은 폴더 이름만 보고 삭제하지 않는다.
- 실제 파일이 없는 빈 폴더와 로컬 생성 산출물만 정리 대상으로 본다.
- public 기본 SVG는 코드 참조가 없음을 확인한 뒤 삭제 대상으로 분류한다.
- Playwright 산출물은 0.19.94.1에서 `.gitignore`에 추가된 상태이므로 repo에 남아 있으면 삭제한다.

## 삭제 대상

### 생성 산출물

- `playwright-report/`
- `test-results/`

### 미사용 public 기본 SVG

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

검색 기준으로 위 SVG 파일은 문서의 삭제 후보 목록 외 코드 참조가 확인되지 않았다.

### 빈 폴더

아래 폴더들은 현재 zip 기준 실제 파일이 없었다. Git에는 원칙적으로 빈 폴더가 추적되지 않으므로 삭제해도 기능 코드 영향은 없다.

```text
app/(admin)/admin/files/
app/(admin)/admin/history/
app/(admin)/admin/invites/
app/(admin)/admin/members/
app/(admin)/admin/partners/
app/(admin)/admin/settings/
app/(admin)/admin/stats/
app/(admin)/admin/subscription/
app/(admin)/admin/units/
app/admin/dashboard/
app/admin/files/
app/admin/history/
app/admin/invites/
app/admin/members/
app/admin/partners/
app/admin/settings/
app/admin/stats/
app/admin/subscription/
app/admin/units/
app/api/workorders/material-lines/
app/invite/company/[token]/
app/invite/error/
app/invite/member/[token]/
app/login/
app/pending/
app/service-paused/
app/system/access-checkpoint/
app/system/audit-logs/
app/system/billing/
app/system/category-rules/
app/system/companies/
app/system/invites/
app/system/standards/customer-onboarding/
app/system/standards/processes/
app/system/standards/product-templates/
app/system/standards/regression/
app/system/standards/seed-status/
app/system/standards/units/
app/system/storage-usage/
app/test/
app/worker/
app/workspace/partners/
app/workspace/standards/
cloudflare/pdf-generator-worker/.wrangler/tmp/
features/workorders/material-lines/
lib/admin/dashboard/
lib/persistence/
```

## 보류 대상

- `docs/` 누적 설계 문서: 현재 정책/운영 판단 근거가 섞여 있으므로 archive 기준을 별도 버전에서 정한다.
- `db/` SQL 파일: full reset, seed, smoke test와 연결되어 있으므로 이번 정리 대상에서 제외한다.
- `app/(workspace)`, `app/(system)`, `app/(public)` 등 route group 상위 폴더: Next.js 라우팅 의미가 있으므로 삭제하지 않는다.
- `cloudflare/pdf-generator-worker` 본체: PDF 생성 Worker 흐름과 관련 있으므로 삭제하지 않는다.

## 적용 후 확인

테스트 가능 시 아래를 확인한다.

```bash
npm run build
npm run test:e2e
npm run test:smoke:db-api
```

ChatGPT/container에서는 `npm run build`를 실행하지 않았다.
