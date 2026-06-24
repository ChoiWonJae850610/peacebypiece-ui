# Codex Productization Sprint Master Pack


> Canonical update (0.24.21.15): synchronized with `docs/project/26-final-policy-decisions-and-master-todo.md`.
Version: 0.24.21.15  
Status: Final execution input before Codex implementation  
Target implementation baseline: 0.24.22 and later Productization Sprints  
Runtime implementation: deferred to Codex

## 1. 목적

0.24.18~0.24.21.4에서 확정한 제품화 기준을 Codex가 실제 구현할 수 있는 Sprint 묶음으로 통합한다. 이 문서는 작은 단편 수정이 아니라 의존성, 위험도, 검증 비용과 사용자 결정 경계를 고려한 실행 순서를 고정한다.

이번 버전은 문서와 roadmap만 변경한다. React/UI, route, API, DB schema, migration, seed, R2, 결제, production mutation은 수행하지 않는다.

## 2. 반드시 먼저 읽을 문서

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/05-productization-bible.md`
4. `docs/project/06-architecture-guide.md`
5. `docs/project/07-wafl-component-standard.md`
6. `docs/project/12-release-engineering.md`
7. `docs/project/13-qa-matrix.md`
8. `docs/project/14-playwright-plan.md`
9. `docs/project/15-browser-device-matrix.md`
10. `docs/project/16-pb-breakdown.md`
11. `docs/project/17-codex-ready-queue.md`
12. `docs/project/18-sprint-queue.md`
13. `docs/project/19-system-default-catalog-and-seed-spec.md`
14. `docs/project/20-customer-signup-consent-approval-trial-spec.md`
15. `docs/project/21-public-website-commercial-onboarding-spec.md`
16. `docs/project/22-ui-routing-remediation-spec.md`

## 3. 실행 원칙

- 1.0 전에는 `master`를 단일 개발·QA 브랜치로 유지한다.
- 최신 ZIP/repo-state와 `origin/master`가 일치하는 clean working tree에서 시작한다.
- 작은 Sprint를 반복하기보다 검증 가능한 큰 Sprint로 묶는다.
- 각 Sprint는 Plan → Implement → Verify → Finish 순서를 따른다.
- UI 변경은 기존 권한, tenant, workflow, 저장 계약을 바꾸지 않는다.
- DB/R2/production mutation은 문서에 명시된 별도 승인 경계 없이 실행하지 않는다.
- 실패한 build/test를 무시하고 commit/push하지 않는다.
- 예상 범위를 벗어난 파일 변경, schema 변경, package/lockfile 변경이 나오면 중단한다.

## 4. 구현 순서

### Sprint A — Productization UI Foundation

PB: PB-005, PB-006, PB-010  
권장 결과 버전: `0.24.22`

범위:

- 고객사 관리자 dashboard, 멤버, 회사 설정/파일 화면의 WAFL 공통화
- `/worker`, `/workspace` 상단·목록·상태 패널의 정보 밀도 축소
- Functions 실행 전 environment, profile, safety grade, dry-run, 예상 영향 report
- empty/loading/error/permission/responsive 상태 보강
- 대표 이미지·사업자등록증의 항목명/상태 badge 중복 제거
- 저장공간 화면의 원통형 usage visualization 적용

제외:

- role/permission 의미 변경
- API/DB schema 변경
- public website 구현
- 가입 provisioning 구현
- workorder public-id migration
- PDF renderer
- production DB/R2 mutation

완료 조건:

- build PASS
- WAFL/functions/permission/responsive contract PASS
- Mutation Audit high-risk 0
- PC/mobile/tablet 수동 체크리스트 생성
- commit/push 후 `master = origin/master`, working tree clean

### Sprint B — System Defaults, Seed and Simulator

PB: 시스템 기본 데이터, PB-011  
권장 결과 버전: `0.24.23`

범위:

- 제품 상·중·하위 기본 분류 확장
- 제품군별 사이즈 스펙 기본 항목
- 신규 회사 provisioning용 idempotent seed
- 기존 고객사 dry-run backfill report
- 서로 다른 quota/usage의 dev/test fixture
- reconciliation/cleanup preview dry-run

필수 안전 경계:

- production seed/backfill 실행 금지
- 기존 고객사 비활성·별칭·순서 덮어쓰기 금지
- system code 재사용·의미 변경 금지
- dry-run 결과에 insert/update/skip/conflict 건수 표시

중단 조건:

- schema/migration이 필요한 경우
- 기존 고객 데이터와 code 충돌
- production 접근 필요
- 속옷·액세서리는 시스템 기본 분류로 추가하되 기본 비활성화한다.

### Sprint C — Customer Signup, Consent and Approval

권장 결과 버전: `0.24.24`

범위:

- 공개 가입 요청 form
- 회사·최초 관리자 입력
- 필수/선택 정책 동의와 version/hash evidence
- 사업자번호·이메일 중복 확인
- 시스템 관리자 가입 요청 Queue
- reviewing/changes_requested/approved/rejected/canceled/provisioning_failed 상태
- 승인 후 회사, 관리자, Trial, quota, 기본 catalog/spec provisioning
- 실패 시 idempotent retry

제외:

- PG 결제
- 미확정 인증 수준
- 미확정 보존기간 자동 purge
- 가입 승인 mandatory four-eyes 강제

중단 조건:

- 동의 evidence schema가 없고 migration 필요
- 회사/사용자 생성 transaction 경계가 불명확
- 사업자번호 처리 방식이 개인정보 정책과 충돌
- production 이메일/SMS 공급자 계약 필요

### Sprint D — Workorder Routing and Identifier

권장 결과 버전: `0.24.25`

범위:

- canonical route `/workspace/workorders/{publicId}`
- 순차 id, page/index query 노출 제거
- stable opaque public identifier
- refresh/direct link/back navigation
- old route compatibility와 redirect
- tenant/permission 재검증
- 모바일 drawer와 PC detail identity 통일

중단 조건:

- 새 DB column/migration/backfill 필요
- 기존 bookmark를 깨야 함
- 기존 작업지시서 code를 public id로 재사용할 수 없음
- authorization 정책 변경 필요

이 Sprint는 조사 결과에 따라 별도 migration Sprint로 분리할 수 있다.

### Sprint E — Public Website and Commercial Onboarding

권장 결과 버전: `0.24.26`

범위:

- Home, Features, Pricing, Guide, Security, Terms, Signup, Login
- 공개 marketing surface와 customer app/auth 경계
- canonical Trial/요금제/저장공간 문구
- demo fixture 기반 제품 화면 캡처
- SEO, sitemap, robots, preview noindex
- 문의·가입 CTA

선행조건:

- 브랜드명/도메인
- 공개 가격/부가세 문구
- 문의 채널
- primary CTA
- repository/deployment 분리 방식

미결정 항목은 placeholder로 공개하지 않고 Blocked로 유지한다.

### Sprint F — PDF and R2 Productization

권장 결과 버전: 후속 별도 계획

범위 후보:

- versioned PDF document model
- draft/final PDF renderer
- R2 private object lifecycle
- signed URL
- quota reservation
- trash/restore/purge
- audit metadata
- PDF/R2 contract and Playwright

확정 입력:

- 관련 발주가 없으면 최종 workorder PDF 즉시 생성 가능.
- 관련 발주가 있으면 모두 발주완료 후 최종 PDF 생성.
- supplier PDF는 발주요청 시 생성.
- 최종 PDF는 최신 파일 1개만 유지하고 과거 파일/metadata 이력은 보관하지 않음.
- 계정 종료 후 30일 view/export/recovery 후 KST 00:00 자동 삭제.
- production destructive command는 기존 승인 경계를 유지.

## 5. 파일 후보와 조사 순서

Codex는 수정 전에 실제 repository에서 다음을 검색해 정확한 파일 목록을 확정한다.

- 관리자 dashboard, 멤버, 회사 설정/파일 route와 feature component
- storage usage card/cylinder component와 quota selector
- `/worker`, `/workspace`, workorder route builder/link/resolver
- Functions 실행 화면, profile/safety report component
- `db/seed/system_standards_seed.sql`과 company provisioning helper
- policy document/consent, company approval, Trial/subscription repository
- public route/auth middleware/host routing
- PDF document model, R2 object repository와 lifecycle helper

파일명은 추측으로 고정하지 않고 search evidence와 책임 경계를 먼저 기록한다.

## 6. 자동 승인 가능 명령

범위 제한·읽기 전용·검증 명령은 같은 prefix에 대해 재확인 없이 승인 가능하다.

- `git status`, `git diff`, `git log`, `git show`
- `rg`, `Get-ChildItem`, `Get-Content`, 파일/경로 조회
- `npm run build`
- `npx tsc --noEmit`
- 기존 test/contract/smoke/Playwright 명령
- `approved-workflow.ps1 -Action Verify`
- `approved-workflow.ps1 -Action Plan`
- explicit path와 PASS evidence를 사용하는 `approved-workflow.ps1 -Action Finish`

자동 승인 금지:

- `git add .`
- force push, reset, clean, checkout restore
- production DB/R2 명령
- seed/reset/cleanup/purge/migration
- package 설치·업데이트
- 범위를 알 수 없는 recursive mutation
- secret/env 출력

## 7. 검증 순서

1. working tree와 origin/master 동기화
2. 변경 파일 책임 범위 확인
3. TypeScript
4. Next build
5. 변경 영역 contract
6. permission/runtime contract
7. Mutation Audit
8. targeted Playwright/smoke
9. responsive PC/mobile/tablet
10. diff와 package/lockfile 검사
11. Plan
12. Finish
13. push 이후 repo-state 생성
14. Vercel 실기기 QA

## 8. 실패·중단·롤백

즉시 중단:

- build/type/contract 실패
- high-risk mutation 발견
- production target 감지
- migration이 문서 승인 없이 필요
- permission/tenant guard 약화
- package/lockfile 예상 외 변경
- 예상 파일 범위를 크게 초과
- 사용자 미결정 정책을 구현값으로 고정해야 함

롤백 원칙:

- destructive git 명령보다 명시적 수정 파일 되돌리기 우선
- DB/R2 mutation이 없으면 source patch 단위로 복구
- migration Sprint는 forward/rollback plan과 dry-run evidence 없이는 시작 금지
- push 후 문제는 same-master follow-up patch로 수정

## 9. Remaining Deferred Decision Queue

Codex Sprint A를 막지 않는 보류 항목만 남긴다.

- PG/payment provider selection after business registration.
- External analytics and cookie consent/banner.
- Instagram content format, cadence, final screenshots, and masking rules.
- Production legal wording and processor disclosures after provider selection.

다음 항목은 더 이상 blocked decision이 아니다: 속옷/액세서리 기본 비활성 제공, 측정 모델, 시스템 분류 이름 변경 금지, 사업자등록증 필수, 이메일 인증, 카드 필수, 승인 시 Trial 시작, 자동 삭제 기본 ON, 30일 recovery/export, 최신 PDF 1개, PDF 생성 단계, 운영자 incident owner.

## 10. Codex 완료 보고 형식

각 Sprint 결과는 반드시 다음을 포함한다.

- 기준 원본 버전
- 결과 버전
- 앱/Productization 진척도
- Git HEAD, branch, ahead/behind, clean 상태
- 실제 수정 파일
- 적용 판단
- Build/TypeScript/Contract/Playwright 결과
- 수동 PC/mobile/tablet/iPad QA 항목
- DB Migration 여부
- DB/R2 실행 여부
- 남은 Blocked 결정
- 다음 버전과 구체적인 다음 작업

## 11. 0.24.22 시작 프롬프트 핵심

- 최신 `master`, clean working tree에서 시작한다.
- Sprint A만 구현한다.
- Sprint B~F는 이번 commit에 섞지 않는다.
- 기존 권한, workflow, DB/API 계약을 유지한다.
- schema/migration, production DB/R2, package 변경이 필요하면 중단한다.
- build와 관련 contract가 PASS한 뒤 explicit files만 commit/push한다.
- Vercel 실기기 QA를 위해 `origin/master`까지 push한다.
