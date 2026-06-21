# WAFL Productization Audit Report — 0.24.15

## 목적

0.24.15는 기존 "전체 화면/소스 리팩터링 감사"를 제품화 감사로 확장한 문서 중심 버전이다. 기능 구현, DB/R2 실행, 대형 리팩터링은 수행하지 않고, 1.0 전 제품화 관점에서 화면·소스·공통 모듈·권한·자동화·출시 준비도를 점검해 후속 Productization Backlog(PB)로 고정한다.

## 기준

- 기준 버전: 0.24.14
- 결과 버전: 0.24.15
- 기준 HEAD: e4f2b4d4
- 기준 Git 상태: master = origin/master, working tree clean
- 감사 방식: repository 정적 구조 감사 + 기존 현재기준/로드맵/Functions 문서 반영
- 실행하지 않은 작업: DB migration, Seed, Reset, Cleanup, R2 mutation, PDF generation, package/lockfile 변경

## 정적 구조 지표

| 항목 | 값 |
| --- | ---: |
| 전체 파일 | 1,897 |
| 코드/스크립트/CSS 파일 | 1,166 |
| app 파일 | 141 |
| components 파일 | 347 |
| features 파일 | 26 |
| lib 파일 | 581 |
| tests 파일 | 43 |
| scripts 파일 | 12 |
| tools 파일 | 21 |
| docs 파일 | 659 |
| TODO/FIXME/HACK match | 8 |
| console.* match | 215 |
| mock/demo/fixture/sample match | 391 |
| runtime 관련 match | 424 |
| permission/system_admin/admin 관련 match | 10,528 |

## 1. WAFL Component Audit

### 관찰

- `components/common/ui/`에는 `WaflButton`, `WaflCard`, `WaflModal`, `WaflState`, `WaflResponsiveFrame`, `WaflThreePanelWorkspace`, `WaflTwoPanelWorkspace`, `WaflSheet`, `WaflToast`, `useWaflMutation`, `useWaflToastOperation` 등 공통 기반이 이미 존재한다.
- `components/admin/common/`에도 `WaflPageHero`, `WaflSectionPanel`, `WaflFilterBar`, `WaflNoticeBox`, `WaflDataTable`, `WaflFeatureCard`가 존재해 관리자 화면용 공통화 기반이 있다.
- 반면 대형 화면 컴포넌트가 여전히 존재한다. 대표적으로 `app/ui/WaflUiCatalogPage.tsx`, `components/admin/settings/AdminSettingsHub.tsx`, `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`, `components/admin/members/AdminMemberManagementDashboard.tsx`, `components/system/companies/SystemCompanyApprovalConsole.tsx`는 후속 분리 후보로 본다.

### 판단

공통 컴포넌트 기반은 충분히 마련되어 있으나, 적용률과 화면별 일관성은 아직 균일하지 않다. 0.24.16에서는 새 컴포넌트 생성보다 기존 WAFL 컴포넌트 적용/정렬을 우선해야 한다.

## 2. UI Consistency Audit

### 관찰

- Workspace 계열은 `WorkspacePageShell`, `WaflResponsiveFrame`, panel shell, save feedback 공통화가 진행되어 있다.
- 관리자 화면은 공통 card/table/filter/section이 존재하지만 화면별 density, empty/loading/error, action bar 배치가 아직 완전히 같은 계약으로 묶였다고 보기 어렵다.
- `/worker`, `/workspace`, `/functions`, `/roadmap`, `/id-control`, `/ui`처럼 internal/productization 화면은 각각의 목적이 다르므로 동일 UI보다 guard와 읽기 전용 성격이 우선이다.

### 판단

사용자 업무 화면의 핵심 UI는 0.24.12에서 공통화 방향이 잡혔다. 다음 위험은 고객사 관리자/시스템관리자 화면의 정보 밀도와 빈 상태 표현 불일치다.

## 3. Source Quality Audit

### 관찰

- 50KB 이상 대형 파일이 app/components/lib/tools에 분포한다.
- `console.*` 사용 흔적이 91개 파일에서 확인된다. 모두 오류는 아니지만 제품화 전 debug 출력, 테스트 전용 출력, audit 출력의 구분이 필요하다.
- TODO/FIXME/HACK는 5개 파일/8건 수준으로 낮지만, 제품화 blocker인지 확인해야 한다.
- `scripts`, `tools`, `tests`, `cloudflare`가 명확히 분리되어 있어 작업 성격별 경계는 개선되어 있다.

### 판단

대형 파일 분리와 debug 출력 정리는 0.24.17의 1차 소스 리팩터링 대상으로 적합하다. 단, 권한/API/DB 경계가 섞인 파일은 단순 분리보다 contract test를 먼저 고정해야 한다.

## 4. Common Module Audit

### 관찰

- `lib/runtime`, `lib/permissions`, `lib/functions`, `lib/i18n`, `lib/generated-documents`, `lib/storage`, `lib/repositories`, `lib/mutations`가 이미 도메인별로 분리되어 있다.
- `features/workorders`와 `features/material-orders`에는 controller/hook/panel util이 존재해 공통화 방향은 있으나, 저장 lock/toast/refresh persistence 계약은 계속 회귀 위험이 높다.
- `components/common/ui/useWaflMutation.ts`와 mutation feedback 유틸은 후속 화면 확산의 기준 모듈로 본다.

### 판단

새 common module을 늘리기보다 이미 있는 common module을 기준으로 화면별 중복 로직을 흡수해야 한다. 특히 저장/토스트/lock/sequence/revision은 공통 계약을 깨지 않게 단계적으로 적용해야 한다.

## 5. i18n Audit

### 관찰

- `lib/i18n/ko/admin.ts`, `lib/i18n/en/admin.ts`가 대형 파일로 존재한다.
- 코드 전체에서 한글 하드코딩 문자열이 다수 확인된다. 이는 한국어 제품 특성상 정상 문자열도 포함하지만, i18n 대상과 고정 운영 문구를 구분하는 기준이 필요하다.
- 고객 공개 화면, 초대/가입/승인, 법무/정책 문구는 i18n 누락 시 제품화 리스크가 크다.

### 판단

i18n은 전체 문자열 일괄 이전보다 공개/고객-facing 경로를 우선해야 한다. 관리자 내부 진단 화면과 개발 콘솔은 한국어 고정 허용 범위를 문서화할 수 있다.

## 6. Runtime / Permission Audit

### 관찰

- 0.24.12~0.24.14에서 runtime/feature gate와 system_admin 정책이 정리되었다.
- 내부 route는 NODE_ENV나 runtime mode만으로 열지 않고 active `system_admin` 정책을 기준으로 접근시키는 방향으로 전환되었다.
- permission 관련 문자열/코드가 매우 넓게 분포한다. 이는 기능 수가 많다는 의미도 있지만, 제품화 전 접근 제어 contract가 화면별로 분리되어 있는지 재검증해야 한다.

### 판단

권한 정책은 큰 방향이 맞다. 후속에서는 새 기능 추가보다 route guard contract, UI affordance, API guard가 같은 의미를 갖는지 확인해야 한다.

## 7. Functions Audit

### 관찰

- 0.24.14에서 `/functions` catalog가 profile, command, safety grade, execution note를 갖도록 정리되었다.
- `functions-automation` profile은 catalog/storage/environment/pdf/approved workflow contract를 묶는 기준이다.
- Seed/Reset/Cleanup/R2/DB mutation은 여전히 dry-run/confirmation/fingerprint/prefix/service-code guard가 필요하다.

### 판단

Functions는 90% 구현/검증 정리 단계에 도달했다. 다음은 실제 실행 확대가 아니라, 실행 전 시나리오와 결과물 경로를 더 명확히 보여주는 자동화 UX 정리다.

## 8. Product Cleanup Audit

### 관찰

- docs root 정리와 보관문서 정책은 0.24.13에서 기준화되었다.
- `playwright-report`, `test-results`, `artifacts`는 full source handoff 제외 대상으로 문서화되어 있다.
- Cloudflare Worker deprecated 단일 파일과 신규 폴더 구조가 공존한다. 무단 삭제하지 않는 정책은 적절하나, 출시 전 deprecated 사용 여부를 한 번 더 결정해야 한다.

### 판단

제품 정리는 문서 구조보다 runtime/debug/test artifact와 deprecated entrypoint 정리가 다음 대상이다. 삭제는 승인된 manifest 방식으로만 진행해야 한다.

## 9. Performance Audit

### 관찰

- app/ui catalog와 일부 관리자 화면은 파일 크기가 크고 render scope가 넓다.
- 작업지시서/발주서 workspace는 panel shell과 layout mode가 정리되었으나, 실제 iPad/Galaxy Tab 스크롤/키보드/focus 성능은 수동 QA 의존도가 높다.
- PDF/R2와 Functions/Simulator는 실제 실행 시 I/O 비용이 크므로 dry-run/report 우선 설계가 계속 필요하다.

### 판단

성능 병목은 bundle/렌더/스크롤/focus와 백엔드 I/O가 분리되어야 한다. 0.24.17에서는 대형 화면 분리와 memoization 후보만 다루고, PDF/R2 I/O는 0.24.18~0.24.20에서 따로 다룬다.

## 10. Release Readiness Audit

### 관찰

- 1.0 전 `master`는 개발/QA 브랜치이며 Vercel은 운영이 아니라 실기기 QA 환경이라는 정책이 문서화되어 있다.
- 제품화 로드맵은 0.24.21까지 기능/감사/검증을 분리한다.
- 아직 PDF/R2 정책, R2/Simulator fixture, Functions 자동화 확장, 통합 실기기 QA가 남아 있다.

### 판단

출시 준비도는 높아졌지만, customer-facing release 기준으로는 아직 blocker가 있다. 특히 PDF, R2, permission contract, responsive QA, i18n 공개문구, mock/demo 제거 기준은 1.0 전 반드시 닫아야 한다.

## 종합 판단

| 영역 | 상태 | 다음 처리 |
| --- | --- | --- |
| WAFL component 기반 | 양호 | 0.24.16 적용률 개선 |
| UI consistency | 부분 양호 | 관리자/시스템 화면 density 정렬 |
| Source quality | 보통 | 0.24.17 대형 파일/console/debug 정리 |
| Common module | 양호 | 저장/토스트/권한 계약 확산 |
| i18n | 보통 | customer-facing 문자열 우선 정리 |
| Runtime/permission | 양호 | contract test와 route/API/UI 의미 일치 확인 |
| Functions | 양호 | 자동화 UX/실행 전 report 강화 |
| Product cleanup | 보통 | deprecated/dev artifact manifest 정리 |
| Performance | 보통 | 대형 화면 분리와 실기기 QA |
| Release readiness | 진행 중 | PDF/R2/QA blocker 닫기 |

## DB Migration

없음.

## 후속 연결

- 0.24.16: PB Critical/High 중 WAFL Component/UI Consistency 적용
- 0.24.17: Source Quality/Common Module/i18n 1차 정리
- 0.24.18: R2/Simulator fixture와 storage reconciliation dry-run
- 0.24.19: PDF/R2 정책 및 생성 구조
- 0.24.20: Functions/Simulator/PowerShell 자동화 확장
- 0.24.21: 통합 검증 체크포인트
