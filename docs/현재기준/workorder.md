# Workorder Current Baseline

- 기준 앱 버전: `0.24.11`
- 목적: 작업지시서 화면, 저장, 권한, 반응형, 첨부/PDF 연계의 현재 기준을 한 곳에 둔다.

## 현재 화면 구조

- 진입 경로: `/workspace/workorders`
- 주요 UI: `components/workorder/WorkOrderWorkspace.tsx`
- 레이아웃 선택: `components/workorder/WorkOrderLayout.tsx`에서 `useWorkspaceLayoutMode()` 결과에 따라 mobile drawer, tablet two-panel, desktop view로 분기한다.
- 오버레이: `components/workorder/WorkOrderOverlay.tsx`에서 생성, 권한, 담당자, 첨부 미리보기/삭제, 재고, 워크플로 검증, 반려 사유, 발주 요청 확인 modal을 모은다.
- 상세 side panel은 기본정보, 원부자재/공정, 첨부, 메모/지시 성격의 정보를 같은 작업지시서 문서 단위로 다룬다.

## 현재 저장 정책

- 작업지시서 저장은 화면 단위 임시 상태만으로 끝내지 않고 DB mutation 완료를 기다리는 직렬화 흐름을 기준으로 한다.
- 같은 작업지시서에서 동시에 여러 저장이 겹치면 document-level lock으로 추가 저장을 막고, 성공 후 서버 응답 상태를 다시 반영한다.
- 기본정보, 담당자, 현재재고, 제조 메모, 원부자재/공정 변경은 변경 대상별 toast/feedback을 분리하되 공통 mutation lifecycle을 사용한다.
- 실패 시 직전 snapshot으로 되돌리고 사용자에게 실패 메시지를 표시한다.
- schema나 migration 없이 기존 PATCH/API 결과 계약을 유지한다.

## 현재 권한 정책

- UI 버튼 노출과 API/server handler 검증은 같은 capability 기준을 사용해야 한다.
- 조회, 작성/수정, 상태 전환, 첨부, 재고 변경, 발주 요청은 역할별로 분리한다.
- 권한 부족은 modal 또는 공통 오류 메시지로 안내하고, 버튼만 숨기는 방식으로 서버 검증을 대체하지 않는다.
- tenant isolation은 company/workorder scope에서 유지한다.

## 날짜/수량 형식

- 납기일은 날짜 필드로 다루며, 화면 표시와 저장 값 변환은 공통 formatter/helper를 우선 사용한다.
- 수량은 숫자 입력/표시를 분리한다. 입력 중 문자열 상태와 저장용 number 변환을 섞지 않는다.
- 재고/원부자재 수량 변경은 결과 배열/transaction 계약을 확인한 뒤 UI에 반영한다.

## Responsive 정책

- mobile은 drawer 중심, tablet은 two-panel, desktop은 multi-column 작업 공간을 기준으로 한다.
- 모바일/태블릿 입력은 keyboard dismissal 후 첫 tap이 Apply/Close 버튼에 도달해야 한다.
- 작업지시서 전용 모달은 공통 modal/focus 정책을 우회하는 pointer/touch blur workaround를 추가하지 않는다.

## PDF 연계 상태

- 작업지시서 PDF 생성 경로는 존재하며, 금액 표시 여부 등 일부 정책은 별도 PDF contract에 남아 있다.
- 발주 요청 PDF와 supplier/material-order PDF는 목적과 금액 표시 정책이 다르므로 같은 문서로 합치지 않는다.
- PDF 정책 핵심 문서는 이번 cleanup에서 보호한다.

## 알려진 미해결 문제

- 실제 Google 로그인과 장시간 입력/저장 흐름은 일부 수동 검증이 남아 있다.
- `/worker` route의 장기 처리 방향은 별도 productization 작업에서 결정해야 한다.
- PDF/R2 최종 저장, 재생성, supplier/material-order 문서 정책은 별도 정책 결정이 필요하다.

## 다음 기능 작업

- 저장 lifecycle 공통화 범위를 workorder/material-order에 계속 맞춘다.
- 반복 click, network delay, refresh 후 persistence evidence를 계약 테스트와 E2E로 보강한다.
- PDF와 첨부/R2 연계를 실제 운영 정책으로 확정한다.

## 관련 테스트

- `tests/customer-workspace-compact-dashboard-contract.mjs`
- `tests/functions-pdf-contract.mjs`
- `tests/functions-db-contract.mjs`
- `tests/simulator-operational-fixture-contract.mjs`
- `npm run audit:wafl-mutations`
