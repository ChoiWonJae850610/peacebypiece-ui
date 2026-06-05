# 프로젝트 파일 구조 감사 1차 (0.19.94.1)

## 목적

테스트가 어려운 기간 동안 기능 로직을 건드리지 않고, 현재 저장소에 남아 있는 파일/폴더 구조를 점검했다. 이번 버전은 삭제 패치가 아니라 **삭제 후보와 보류 후보를 분리하는 감사 문서화**가 목적이다.

## 감사 기준

- Next.js route group은 괄호 폴더명만 보고 삭제하지 않는다.
- R2, 첨부, 메모, 휴지통, purge 흐름은 변경하지 않는다.
- DB schema와 full_reset.sql은 변경하지 않는다.
- 기능 코드 삭제는 테스트 가능 시점 이후로 미룬다.
- 생성 산출물은 `.gitignore`에 포함해 재유입을 막는다.

## 현재 구조 요약

| 영역 | 관찰 내용 | 판단 |
| --- | --- | --- |
| `app/(public)` | 실제 공개 라우트가 존재한다. | 유지 |
| `app/(workspace)` | 실제 workspace 라우트가 존재한다. | 유지 |
| `app/(system)` | 실제 system 라우트가 존재한다. | 유지 |
| `app/admin/*` | 다수 하위 폴더가 비어 있다. | 삭제 후보 |
| `app/(admin)/admin/*` | 다수 하위 폴더가 비어 있다. | 삭제 후보 또는 라우팅 설계 재확인 필요 |
| `app/system/*` | route group 밖에 같은 이름의 빈 폴더가 다수 존재한다. | 삭제 후보 |
| `app/workspace/*` | route group 밖에 일부 빈 폴더가 존재한다. | 삭제 후보 |
| `public/*.svg` | Next 기본 SVG 파일로 보이며 현재 참조가 확인되지 않았다. | 삭제 후보 |
| `playwright-report/`, `test-results/` | Playwright 실행 산출물이다. | repo 제외 대상 |
| `docs/` | 버전별 작업 문서가 300개 이상 누적되어 있다. | archive 정책 필요 |
| `db/` | full_reset, seed, smoke test 관련 파일이 있다. | 유지, 별도 감사 필요 |
| `cloudflare/` | R2/PDF worker 관련 파일이 있다. | 유지 |

## 즉시 삭제 가능 후보

다음 항목은 현재 구조상 기능 코드가 없거나 생성 산출물로 보인다. 단, 이번 버전에서는 실제 삭제하지 않고 후보로만 기록한다.

```text
playwright-report/
test-results/
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
```

`playwright-report/`와 `test-results/`는 Playwright가 자동 생성하는 로컬 결과물이므로 `.gitignore`에 추가했다.

## 빈 폴더 삭제 후보

다음 폴더들은 현재 파일이 없는 빈 폴더로 확인되었다. Next.js route group 또는 향후 라우팅 계획과 충돌할 수 있으므로 실제 삭제는 별도 패치에서 진행한다.

```text
app/(admin)/admin/files
app/(admin)/admin/history
app/(admin)/admin/invites
app/(admin)/admin/members
app/(admin)/admin/partners
app/(admin)/admin/settings
app/(admin)/admin/stats
app/(admin)/admin/subscription
app/(admin)/admin/units
app/admin/dashboard
app/admin/files
app/admin/history
app/admin/invites
app/admin/members
app/admin/partners
app/admin/settings
app/admin/stats
app/admin/subscription
app/admin/units
app/system/access-checkpoint
app/system/audit-logs
app/system/billing
app/system/category-rules
app/system/companies
app/system/invites
app/system/standards/customer-onboarding
app/system/standards/processes
app/system/standards/product-templates
app/system/standards/regression
app/system/standards/seed-status
app/system/standards/units
app/system/storage-usage
app/test
app/worker
app/workspace/partners
app/workspace/standards
features/workorders/material-lines
lib/admin/dashboard
lib/persistence
```

## 보류해야 할 항목

아래 항목은 불필요해 보여도 현재 기능과 연결될 가능성이 있어 즉시 삭제하지 않는다.

```text
app/(workspace)/workspace/*
app/(system)/system/*
app/(public)/*
app/api/*
components/*
features/material-orders/*
features/materials/*
lib/*
db/*
cloudflare/*
```

특히 `app/(workspace)`, `app/(system)`, `app/(public)`은 Next.js route group이므로 괄호 폴더 자체를 삭제하면 라우팅이 깨질 수 있다.

## docs 정리 판단

`docs/`에는 버전별 설계/감사/패치 문서가 많이 누적되어 있다. 이 문서들은 현재 의사결정 기록이므로 곧바로 삭제하지 않는다. 대신 다음 방향이 적절하다.

```text
1. 현재 기준 문서만 docs/current/ 또는 docs/현재기준/에 유지
2. 오래된 버전별 문서는 docs/archive/ 또는 docs/보관문서/로 이동
3. 정책/약관 공개 문서와 개발 메모를 분리
4. 버전별 패치 설명 문서는 장기적으로 CHANGELOG 또는 release-notes로 통합
```

## 다음 정리 패치 제안

### 0.19.94.2 — 확실한 생성 산출물 정리

- `playwright-report/` 삭제
- `test-results/` 삭제
- Next 기본 public SVG 참조 재확인 후 삭제
- 빈 폴더 중 route와 무관한 항목만 삭제

### 0.19.94.3 — docs archive 정책 적용

- 현재 기준 문서와 오래된 버전별 문서 분리
- `docs/README.md`에 문서 구조 설명 추가
- 정책 문서/개발 문서/테스트 문서/보관 문서 분리

### 0.19.95 — 고객사 회사 파일 DB/API 1차 복귀

- 테스트 가능 여부가 낮더라도 DB schema와 smoke test 중심으로 작게 진행
- R2 실제 업로드는 이후 버전에서 처리

## 이번 버전에서 변경한 것

```text
- APP_VERSION을 0.19.94.1로 변경
- .gitignore에 Playwright 로컬 산출물 제외 규칙 추가
- 프로젝트 파일 구조 감사 문서 추가
```

## 이번 버전에서 변경하지 않은 것

```text
- 기능 코드 삭제 없음
- route 삭제 없음
- DB schema 변경 없음
- full_reset.sql 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음
- package.json/package-lock.json 변경 없음
```
