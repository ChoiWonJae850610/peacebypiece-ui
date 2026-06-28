# Productization Backlog — 0.24.21.9

## 기준

0.24.15 WAFL Productization Audit에서 도출한 제품화 백로그다. PB 항목은 기능 개발 TODO가 아니라 1.0 전 출시 준비도를 끌어올리기 위한 추적 단위다.

## 우선순위 정의

| 등급 | 의미 |
| --- | --- |
| Critical | 1.0 전 blocker. 보안, 권한, 데이터 보존, 출시 가능성에 직접 영향 |
| High | 제품 품질과 유지보수성에 큰 영향. 다음 1~3개 버전 안에 처리 권장 |
| Medium | 품질 개선. 주요 blocker 이후 처리 |
| Low | 정리/문서/개발자 경험 개선. 승인된 cleanup 때 처리 |

## Backlog

| ID | Priority | 영역 | 제목 | 근거 | 권장 버전 |
| --- | --- | --- | --- | --- | --- |
| PB-001 | Critical | Runtime/Permission | 내부 route guard와 API guard 의미 일치 재검증 | system_admin 전환 이후 route/UI/API guard 의미가 다르면 제품화 위험 | 0.24.16 |
| PB-002 | Critical | Release Readiness | PDF/R2 임시/최종 파일 정책 확정 | 작업지시서/발주서 PDF 생성·보관·삭제 정책이 출시 blocker | 0.24.19 |
| PB-003 | Critical | Product Cleanup | mock/demo/fallback 데이터의 운영 경로 잔존 여부 차단 | mock/demo 관련 match가 넓게 분포하며 운영 화면 fallback은 신뢰성 위험 | 0.24.17 |
| PB-004 | Critical | Responsive QA | iPad mini/Galaxy Tab/mobile workspace 스크롤·focus 통합 확인 | 0.24.12 이후 수동 실기기 QA가 완료 조건 | 0.24.21 |
| PB-005 | High | WAFL Component | 관리자 주요 화면의 section/filter/table/empty 상태 공통화 | 공통 컴포넌트는 있으나 화면별 density/empty/loading/error 차이 잔존 | 0.24.16 |
| PB-006 | High | UI Consistency | `/worker`, `/workspace`, 관리자 dashboard의 정보 밀도 기준 고정 | 제품화 전 고객사 관리자 화면 메인 정리가 필요 | 0.24.16 |
| PB-007 | High | Source Quality | 50KB 이상 대형 화면/도메인 파일 분리 후보 확정 | 대형 파일이 app/components/lib/tools에 집중 | 0.24.17 |
| PB-008 | High | Common Module | 저장 lock/toast/sequence/revision 공통 계약 확산 | 저장 중 값 소실 회귀 방지의 핵심 | 0.24.17 |
| PB-009 | High | i18n | customer-facing 공개/초대/가입/정책 문자열 우선 i18n 정리 | 한글 하드코딩이 넓게 존재하며 공개 화면부터 구분 필요 | 0.24.17 |
| PB-010 | High | Functions | `/functions` 자동화 결과/명령/안전 등급 UX 보강 | 0.24.14에서 catalog 기반은 마련됐고 실행 전 report가 다음 단계 | 0.24.20 |
| PB-011 | High | R2/Simulator | R2 usage fixture와 cleanup preview/reconciliation dry-run 고정 | 플랜별/시나리오별 저장공간 그래프 검증 필요 | 0.24.18 |
| PB-012 | Medium | Product Cleanup | deprecated Cloudflare Worker entrypoint 유지/삭제 결정 | 단일 파일과 신규 폴더가 공존하나 무단 삭제 금지 | 0.24.18 |
| PB-013 | Medium | Performance | 대형 catalog/settings/admin 화면 render scope 축소 | 대형 화면 파일과 UI catalog가 성능/유지보수 위험 | 0.24.17 |
| PB-014 | Medium | Testing | Productization audit 전용 contract test 추가 | 감사 산출물과 PB format 회귀 방지 필요 | 0.24.16 |
| PB-015 | Medium | Documentation | README/docs index/roadmap의 현재 버전·제품화 상태 동기화 | 0.24.15 이후 current-state를 제품화 감사 기준으로 갱신해야 함 | 0.24.15 |
| PB-016 | Low | Developer Experience | console/debug/audit 출력 허용 기준 문서화 | console.* match가 존재하므로 prod/debug 구분 필요 | 0.24.17 |
| PB-017 | Low | Documentation | PB 완료/보류/이월 상태 추적 규칙 추가 | backlog가 실제 roadmap과 분리되지 않도록 상태 기준 필요 | 0.24.16 |

## 0.24.16 진입 기준

0.24.16은 PB-001, PB-005, PB-006, PB-014, PB-017 중 UI/contract 영향이 낮은 항목부터 처리한다. 권한 의미가 바뀌거나 제품 정책 결정이 필요한 경우 구현하지 않고 사용자 결정 항목으로 전환한다.

## 0.24.17 진입 기준

0.24.17은 PB-003, PB-007, PB-008, PB-009, PB-013, PB-016을 대상으로 하되 대형 파일 분리는 화면별 blast radius를 제한한다. package/lockfile, DB schema, R2, migration은 포함하지 않는다.

## DB Migration

없음.


## 0.24.16 적용 메모

0.24.16은 PB 구현을 바로 시작하기 전에 Codex/GPT 공동 작업 문맥을 프로젝트 문서로 고정한다. 이 작업은 PB-014(Productization audit 전용 contract test/회귀 방지)와 PB-017(PB 완료/보류/이월 상태 추적 규칙)의 기반 작업이다.

다음 실제 구현 Sprint는 `docs/project/` 문서와 이 backlog를 읽은 뒤 PB-001, PB-005, PB-006 등 낮은 blast radius 항목부터 시작한다.


## 0.24.21 PB 실행 준비 상태

세부 기준은 `docs/project/16-pb-breakdown.md`를 따른다.

- Ready: PB-005, PB-006, PB-010, PB-013
- Conditional: PB-001, PB-002, PB-004, PB-011
- Sprint #2 우선순위: PB-005 + PB-006 + PB-010
- PB-002 final PDF/retention과 production purge는 사용자 결정 전 구현 queue에서 제외
- 통합 실기기 QA는 0.24.25 후보로 보존

## 0.24.21.9 Master TODO synchronization

`docs/project/26-final-policy-decisions-and-master-todo.md` is the canonical consolidated queue. The following productization tracks remain open until implementation and verification evidence exists:

- Sprint A: PB-005, PB-006, PB-010, storage cylinder, company-file state cleanup, responsive/resource states.
- System defaults and size spec provisioning, cm/inch fraction input, safe seed/backfill.
- Signup/email verification/card-first Trial/approval/payment-failure/account deletion lifecycle.
- Opaque workorder URL identifier with tenant authorization and no share links.
- PDF/R2 productization with latest-final-only retention.
- Public website, production environment split, PG/email/domain launch integration.
- Repository cleanup, simulator/R2 adapters, integrated device QA, release/legal placeholder replacement.

Deferred decision TODO: underwear/accessories default catalog, PG provider, Instagram content plan, external analytics, and cookie banner.

## 0.24.28 Reserved: PDF and R2 Lifecycle

- Complete the actual R2 lifecycle simulator with valid PNG/JPEG/PDF fixtures.
- Cover representative design files, multiple attachments, trash, restore, permanent delete, GET 404 verification, missing R2 handling, exact-key orphan audit, manifest-scoped reconciliation, upload-success/DB-failure rollback, PDF cleanup/regenerate, and PowerShell menu/docs/contracts cleanup.
- Include only bounded performance fixtures: small thumbnail, 1MB image, 5MB image, 10MB PDF, and limited multiple attachments.
- Do not create actual tens-of-GB R2 fixtures.
- Keep production mutation forbidden.
- Require exact scope confirmation before implementation.

## 0.24.30 Reserved: Storage Enforcement, Termination, and Automatic Deletion

- Capacity profile: 0%, <1%, 10%, 20%, 30%, 50%, 70%, 90%, 99%, 100%, and 110%.
- Include plan-specific storage limits, Trial 100MB linkage, DB capacity snapshot profile, visual fill clamp 0~100%, exact text percentage, over-limit display, remaining capacity, trash inclusion policy, upload preflight enforcement, concurrent quota race, warning threshold, grace period, termination, automatic deletion scheduling, cancellation/recovery, capacity apply/verify/restore commands, production mutation blocking, and dev/test exact confirmation.
- Future PowerShell menu names may include Simulator Storage Capacity Plan, Simulator Storage Capacity Apply, Simulator Storage Capacity Verify, Simulator Storage Capacity Restore, Simulator R2 Performance Fixture Plan, Simulator R2 Performance Fixture Execute, and Simulator R2 Performance Fixture Cleanup.
- Do not assign menu numbers until the latest pipeline menu is checked for conflicts.

## Capacity Fixture Backlog

- H/I/J capacity expectations currently differ between DB scenario data and attachment capacity manifest data; for example DB scenario H is 99%, while attachment capacity manifest H is about 70~80%.
- Do not correct this through immediate mutation.
- Keep lifecycle fixture, capacity fixture, and performance fixture as separate fixture classes.
- Prefer a future 0.24.30 profile apply approach over permanently assigning every capacity boundary to A~J companies.
