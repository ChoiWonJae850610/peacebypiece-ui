# Material Order Current Baseline

- 기준 앱 버전: `0.24.11`
- 목적: 발주서/자재발주 화면, 상태, 저장, 권한, 작업지시서 연결, PDF 준비 상태의 현재 기준을 정리한다.

## 현재 화면 구조

- 진입 경로: `/workspace/material-orders`
- API 경로: `/api/material-orders`, `/api/material-orders/suppliers`
- 주요 도메인: `lib/material-orders/*`
- 발주서는 header와 lines, lines별 allocations를 함께 가진다.
- 공급처, 자재종류, 납기일, 품목, 수량, 단가, 금액, 메모, 작업지시서 배분 정보를 다룬다.

## 현재 상태 정책

현재 상태 값은 `lib/material-orders/types.ts` 기준이다.

- `draft`
- `review_requested`
- `approved`
- `order_placed`
- `rejected`
- `cancelled`

상태 전환과 편집 가능 여부는 `lib/material-orders/statusFlow.ts`에서 판단한다. 작업자와 관리자 편집 가능 범위가 다르며, 발주 요청 전 상태에서 핵심 필드 편집을 허용한다.

## 현재 저장 정책

- header 변경과 detail collection 변경을 분리한다.
- 품목 추가/수정/삭제와 작업지시서 allocation 변경은 collection mutation으로 즉시 저장한다.
- refresh 후에도 선택한 품목과 allocation 결과가 DB 기준으로 유지되어야 한다.
- 상태 전환 전에는 필요한 detail 변경을 먼저 저장한다.
- 실패 시 직전 lines 상태로 rollback하고 오류 toast를 표시한다.
- schema/migration 없이 기존 material-order transaction과 WAFL patch result 계약을 사용한다.

## 작업지시서 연결

- material-order line은 여러 작업지시서 allocation을 가질 수 있다.
- 한 작업지시서도 여러 material-order line과 연결될 수 있다.
- allocation 수량 합계는 주문 수량을 초과하지 않도록 서버 검증이 필요하다.
- allocation은 작업지시서별 필요량과 실제 발주량을 구분한다.

## 권한 정책

- `material.read`, `material.order.request`, `material.order.place`, `material.inventory.read` 계열 capability를 기준으로 한다.
- UI affordance와 API guard는 같은 permission/capability 판단을 사용해야 한다.
- 발주 요청, 승인/반려, 발주 완료, 취소는 조회 권한과 분리한다.

## Responsive 정책

- 모바일은 리스트와 상세를 분리하고, 태블릿은 list/drawer 또는 two-panel을 사용한다.
- 발주 품목 추가/수정 modal은 모바일 키보드가 닫힌 뒤 첫 tap이 버튼에 도달해야 한다.
- 작은 화면에서 공급처, 납기일, 품목 추가, 상태 전환 버튼은 줄바꿈/고정 높이로 겹침을 피한다.

## PDF 준비 상태

- 내부 발주서와 외부 자재 전달 요청서는 목적이 다르다.
- 내부 발주서는 금액/총액 포함 가능성이 있고, 외부 전달 문서는 금액 제외가 기본 방향이다.
- PDF 생성, R2 저장, 재생성, 파일명 규칙은 별도 PDF 정책 결정 후 확정한다.

## 알려진 미해결 문제

- supplier/material-order PDF 최종 정책은 아직 product decision이 필요하다.
- R2 저장과 attachment 등록 시점은 실제 운영 flow에 맞춰 별도 검증이 필요하다.
- 상태 전환 반복 클릭과 refresh persistence는 E2E 보강 대상이다.

## 관련 테스트

- `tests/e2e/functions-core.spec.mjs`
- `tests/e2e/helpers/functionsResponsive.mjs`
- `tests/customer-workspace-compact-dashboard-contract.mjs`
- `npm run audit:wafl-mutations`
