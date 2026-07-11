# WAFL v2 Source, DB Boundary, and Release Policy

Version: `2.0.0-alpha.20`
Status: confirmed architecture boundary; no DB/API implementation

## 1. 결론

WAFL 저장소의 폴더는 공개 제품 버전이 아니라 실행 환경과 책임으로 나눈다.

```text
app/         = Next.js web, admin, API, document, internal tools
apps/mobile/ = Expo React Native customer app
db/          = current legacy DB baseline and guarded tooling
db/v2/       = future v2 DB design/migration workspace
```

`app/v1`, `app/v2`, `apps/mobile/v1`, `apps/mobile/v2`, `db/v1`은 만들지 않는다. 공개 앱이 `1.0.0`으로 출시되어도 현재 내부 architecture line `2.0.0-alpha.x`와 충돌하지 않는다.

## 2. Application boundary

### `app/`

책임:

- Next.js App Router.
- `www.wafl.co.kr` 공개 랜딩.
- 시스템관리자와 고객사 관리자 고급 운영 화면.
- 기존 `/workspace` 전환기 화면.
- API route와 server integration.
- PDF/R2/Worker 연결 경계.
- 내부 `/ui`, `/roadmap`, `/functions` 확인 화면.

`/system`과 `/workspace`는 장기 제거 대상이지만 alpha.20에서 이동·숨김·삭제하지 않는다. 고객 앱이 기능을 대체하고 deprecation/guard/removal work order가 승인된 뒤 단계적으로 정리한다.

### `apps/mobile/`

책임:

- iPhone, iPad, Galaxy Tab 우선 고객 앱.
- 제작 카드의 일상 업무 UX.
- camera/image/file/share 같은 향후 native interaction.
- API contract consumer.

alpha.20에서는 mock 상태를 유지하며 새 WorkOrder 계약을 runtime import하지 않는다.

## 3. Version boundary

세 가지 버전을 구분한다.

| 종류 | 예 | 책임 |
| --- | --- | --- |
| 내부 architecture generation | `2.0.0-alpha.20` | 저장소 설계/개발 checkpoint |
| 공개 앱 semantic version | `1.0.0` 가능 | App Store/Play Store 고객 release |
| API/document schema version | `v1`, integer schema version | 호환성과 payload/snapshot 계약 |

폴더 이름을 public release number에 맞춰 재구성하지 않는다. API path versioning이 필요하면 호환성 정책으로 결정하며 source root를 복제하지 않는다.

## 4. DB v1/v2 boundary

현재 실행 가능한 legacy/current baseline:

- `db/schema/`
- `db/migrations/`
- `db/audits/`
- `db/seed/`
- `db/test/`

이 경로는 alpha.20에서 수정·이동하지 않는다. 특히 `db/schema/full_reset.sql`을 `db/v1`로 옮기지 않는다.

신규 `db/v2/`는 다음 책임만 가진다.

- future integrated schema.
- ordered additive migration drafts.
- read-only pre/post apply audits.
- deterministic dev/test seeds.
- schema/tenant/pagination/performance tests.

alpha.20의 `db/v2`에는 README만 존재한다. SQL, runner, connection script, seed, reset은 없다.

## 5. Full Reset policy

v2 Full Reset은 필요하지만 지금 만들지 않는다.

생성 조건:

1. additive migration sequence가 안정됨.
2. dev/test apply와 post-apply audit가 반복 PASS.
3. 500/5,000건 성능 gate가 PASS.
4. migration과 integrated schema의 parity contract가 존재.
5. owner가 별도 work order로 승인.

v2 Full Reset은 dev/test 전용이다. production에서는 완전히 차단하며 loading/UI 오류의 일반 해결책으로 사용하지 않는다.

## 6. Migration and Neon policy

정상 운영 경로:

```text
alpha.21 SQL draft + static contract
-> owner review
-> alpha.22 approved Neon dev/test branch apply
-> post-apply read-only audit
-> deterministic 500/5,000 seed
-> query/payload benchmark
-> migration stabilization
-> future integrated full_reset
```

Neon SQL Editor에 전체 SQL을 수동 붙여넣는 방식은 기본 절차가 아니다. 승인된 migration runner와 tracked PowerShell 안전장치를 사용한다. 직접 SQL은 runner를 사용할 수 없는 예외 복구에만 허용하며 정확한 환경·SQL·rollback을 별도 승인받는다.

## 7. Resolved alpha.19 policy decisions

### Code ownership

- 회사/브랜드 code: 고객사 관리자 생성·관리.
- 시즌 code: system default 제공, 고객사 관리자 추가 가능.
- 품목 code: system default 제공, 고객사 관리자가 활성화·별칭 설정.
- code 변경은 기존 발행 문서번호를 바꾸지 않는다.
- finalized revision은 당시 code snapshot을 보존한다.

### Issued document retention

- 발행된 R0/R1/R2 revision과 document snapshot은 work order와 함께 보존한다.
- 최신 하나만 남기는 방식은 사용하지 않는다.
- work order가 휴지통에서 30일 후 purge될 때 관련 문서도 retention/purge manifest에 포함한다.
- failed temporary render와 duplicate temporary output은 별도 cleanup 대상이 될 수 있다.

### Inventory authority

- `material_inventory_lots` 또는 대응 lot/ledger가 source of truth다.
- `material_stocks` 같은 aggregate는 read model/cache다.
- aggregate table을 재고 원장으로 직접 수정하지 않는다.

### Correction after completion

- 완료 revision을 reopen하지 않는다.
- correction reason으로 다음 draft revision을 만든다.
- 예: finalized R2 -> R3 draft -> 수정 -> issue/finalize.
- `correction`을 일반 top-level work order 상태로 추가하지 않는다.

### RLS and system administration

- RLS contract는 alpha.20에 포함한다.
- alpha.21 SQL draft, alpha.22 dev/test apply/verification 대상이다.
- production cutover 전 필수 gate다.
- system-admin privileged access는 tenant member path와 분리하고 audit를 강제한다.

## 8. Legacy archive policy

legacy DB/API/source는 다음 조건이 모두 충족되기 전 archive/delete하지 않는다.

- v2 API read/write cutover 완료.
- mobile과 remaining admin consumer 전환 완료.
- external job/writer reference 0.
- dual-read mismatch 0.
- rollback window 종료.
- export/delete/restore/purge coverage 완료.
- owner의 별도 destructive cleanup 승인.

Archive는 먼저 read-only compatibility로 전환하고, rename/move/drop은 마지막 단계에서 수행한다.

## 9. PowerShell boundary

alpha.20에서는 menu나 script를 추가하지 않는다. 기존 tracked entrypoint는 `tools/pipeline/peacebypiece-auto-pipeline.ps1`이다.

후속 후보:

- V2 Schema Contract Validate: read-only/safe.
- V2 Migration Validate: read-only/safe.
- V2 Dev/Test Migration Apply: mutation/dev-test-only/confirmation.
- V2 Post-Apply Audit: read-only.
- V2 Dev/Test Full Reset: destructive/dev-test-only/explicit confirmation.
- V2 Performance Seed 500/5000: mutation/dev-test-only/explicit confirmation.

정확한 menu number는 alpha.21~22에서 기존 menu 충돌을 확인한 뒤 정한다.

## 10. Alpha.20 boundary

허용:

- `db/v2` README workspace.
- type-only WorkOrder contracts.
- static/compile contract tests.
- architecture/API contract documents.

금지:

- migration/full-reset/seed SQL.
- DB/Neon access or mutation.
- app/api or repository implementation.
- mobile runtime connection.
- R2/Worker/PDF implementation.
- legacy path move.
