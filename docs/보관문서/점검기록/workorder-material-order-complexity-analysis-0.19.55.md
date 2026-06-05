# 작업지시서 / 원단·부자재 복잡도 분석 (0.19.55)

## 목적

0.19.53 소스 전체 리팩토링 분석 이후, 실제 기능 추가 전에 가장 회귀 위험이 큰 두 업무 영역을 별도로 분석한다.

- 작업지시서: workflow, PDF, R2, 첨부, 디자인, 메모, 이력, 권한, 담당자 변경
- 원단·부자재 발주: 발주 상태, 자재 할당, 공급처, 단가/수량, PDF, 작업지시서 연결

이번 버전은 분석 문서만 추가한다. 기능 코드, API, DB schema, R2 key, PDF 생성 로직은 변경하지 않는다.

## 현재 규모 요약

0.19.54 기준으로 작업지시서/원단·부자재 관련 TypeScript 파일은 약 247개이며, 주요 업무 경로만 합산해도 약 28,000라인 이상이다. 이 범위는 단순 UI가 아니라 상태 전이, DB 저장, R2 파일 처리, PDF 생성, 이력 기록, 권한 판정이 동시에 얽혀 있다.

주요 대형 파일은 다음과 같다.

| 영역 | 파일 | 성격 | 위험도 |
|---|---|---:|---|
| 작업지시서 드로잉 | `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx` | 대형 client UI | 중 |
| 작업지시서 API | `lib/workorder/api/workOrderRouteHandlers.ts` | route handler 집약 | 고 |
| 첨부/메모 DB | `lib/workorder/persistence/dbAttachmentMemoRepository.ts` | DB/R2 연계 | 고 |
| 원단·부자재 DB | `lib/material-orders/repository.ts` | 발주 저장/조회 | 고 |
| 작업지시서 조회 SQL | `lib/workorder/repository/dbWorkOrderSelectSql.ts` | DB select 조합 | 고 |
| 작업지시서 첨부 패널 | `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx` | UI + action 연결 | 중 |
| 작업지시서 메모 패널 | `components/workorder/sidepanel/WorkOrderMemoPanel.tsx` | UI + action 연결 | 중 |
| 원단·부자재 유틸 | `features/material-orders/materialOrderPanelUtils.ts` | UI 계산/표시 | 중 |
| 작업지시서 PDF | `lib/workorder/serverOrderRequestPdf.ts` | PDF 출력 | 고 |
| 원단·부자재 API | `app/api/material-orders/route.ts` | 발주 route | 고 |
| 작업지시서 메모 API | `app/api/workorders/memos/route.ts` | 메모 route | 고 |
| 작업지시서 PDF route | `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts` | PDF 생성/첨부 | 고 |
| 첨부 업로드 완료 route | `app/api/workorders/attachments/upload/complete/route.ts` | R2 업로드 완료 | 고 |

## 작업지시서 복잡도 구조

### 1. Workflow / 상태 변경

핵심 파일:

- `lib/workorder/workflow.ts`
- `lib/workorder/workflowPolicy.ts`
- `lib/workorder/workflowActionGate.ts`
- `lib/workorder/actionFlow/workflowResults.ts`
- `lib/hooks/workorder/useWorkOrderWorkflowActions.ts`
- `app/api/workorders/status/route.ts`
- `lib/workorder/api/workOrderRouteHandlers.ts`

현재 위험 지점:

1. 상태 변경 판정이 UI hook, API handler, policy, actionFlow에 분산되어 있다.
2. 검토요청/검토완료/발주요청/검수/완료 흐름은 권한과 상태가 같이 얽힌다.
3. 작업지시서 상세 저장, 생산구성 저장, 발주 요청, PDF 생성이 상태 변경과 느슨하게 연결되어 있다.
4. 관리자와 일반 멤버의 action 가능 여부가 화면 표시와 서버 검증에서 모두 맞아야 한다.

리팩토링 원칙:

- 상태 전이 자체는 `workflowPolicy` / `workflowActionGate` 쪽으로 더 모으는 방향이 맞다.
- UI hook은 버튼 표시와 사용자 입력만 담당하게 해야 한다.
- API route는 thin하게 유지하고, 실제 검증/저장/이력 생성은 service 계층으로 이동하는 방향이 안전하다.
- 한 번에 분리하지 말고 상태별 테스트가 가능한 단위로 나눠야 한다.

권장 순서:

1. workflow 상태/권한 판정 함수 목록 문서화
2. UI 표시용 capability와 서버 검증용 guard의 입력/출력 일치 여부 점검
3. 상태 변경 route에서 중복된 payload 검증만 작은 helper로 분리
4. actionFlow 결과 객체 형태를 안정화
5. 그 다음에 기능 추가

### 2. PDF 생성 흐름

핵심 파일:

- `lib/workorder/serverOrderRequestPdf.ts`
- `lib/workorder/presentation/orderRequestDocumentPresentation.ts`
- `lib/workorder/presentation/orderRequestDocumentPrint.ts`
- `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts`
- `app/api/workorders/[workOrderId]/generated/order-request-html/route.ts`

현재 위험 지점:

1. PDF는 단순 출력물이 아니라 작업지시서 상태, 발주 정보, 공장별 정보, 첨부 저장과 연결된다.
2. PDF 생성 후 attachment record가 만들어지는 흐름은 R2/DB와 동시에 엮인다.
3. 출력 문구/테이블 구성 변경은 비교적 안전하지만, 생성 시점/저장 경로/첨부 연결은 고위험이다.

리팩토링 원칙:

- PDF 디자인/문구 수정은 presentation layer에서만 처리한다.
- PDF 생성 route와 첨부 저장 route는 기능 변경 전 별도 분석이 필요하다.
- generated document type과 source type은 지금 구조를 유지한다.
- R2 key 구조는 현재 company-scoped 구조를 그대로 사용하고, legacy compatibility는 새로 추가하지 않는다.

권장 순서:

1. PDF 출력 데이터 view model 고정
2. PDF 문구/레이아웃 수정은 presentation 파일에서만 처리
3. PDF route의 side effect 목록 문서화
4. PDF 자동 첨부 흐름은 별도 테스트 후 수정

### 3. 첨부 / 디자인 / 메모 / R2

핵심 파일:

- `lib/workorder/persistence/dbAttachmentMemoRepository.ts`
- `lib/workorder/persistence/attachmentMemoTypes.ts`
- `lib/workorder/attachments/attachmentUploadApiClient.ts`
- `lib/workorder/attachments/attachmentDeleteApiClient.ts`
- `lib/workorder/attachments/attachmentFileRoute.ts`
- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`
- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`
- `app/api/workorders/attachments/*`
- `app/api/workorders/memos/route.ts`

현재 위험 지점:

1. 사용자가 보는 첨부/디자인/메모는 한 패널에 있지만, 내부적으로는 DB record, R2 object, thumbnail, primary flag, soft delete가 얽힌다.
2. 파일 삭제/복원/영구삭제 흐름은 저장소관리와도 연결된다.
3. 메모는 thread/reply 구조이며 수정/삭제/답글이 UI에서 동시에 처리된다.
4. 업로드 완료 route는 R2 key와 DB record가 어긋나면 orphan file 또는 broken attachment가 생길 수 있다.

리팩토링 원칙:

- R2 key 생성 규칙은 절대 화면 파일에서 만들지 않는다.
- 첨부/메모 삭제/복원/purge 흐름은 저장소관리와 함께 검증해야 한다.
- 패널 UI 정리는 가능하지만, repository와 route side effect는 한 버전에서 동시에 건드리지 않는다.

권장 순서:

1. 첨부/메모 UI component와 action client 분리 상태 점검
2. attachment/memo API response type 통일
3. 삭제/복원/purge route side effect 문서화
4. 파일 업로드 완료 route는 별도 고위험 작업으로 분리

## 원단·부자재 발주 복잡도 구조

### 1. 발주 상태 흐름

핵심 파일:

- `lib/material-orders/statusFlow.ts`
- `lib/material-orders/service.ts`
- `lib/material-orders/repository.ts`
- `app/api/material-orders/route.ts`
- `features/material-orders/MaterialOrderDraftEditor.tsx`
- `features/material-orders/hooks/useMaterialOrderDraftEditor.ts`

현재 상태 흐름:

- 작성중
- 검토요청
- 발주요청
- 발주완료

현재 위험 지점:

1. `draft → reviewRequested → approved → orderPlaced` 흐름은 비교적 단순하지만, 실제 화면에서는 공급처/품목/수량/단가/작업지시서 연결이 함께 움직인다.
2. 상태 변경 전 상세 저장 조건이 있다.
3. 발주완료 이후 작업지시서 쪽 상태와 연결되는 규칙이 커질 가능성이 높다.

리팩토링 원칙:

- 상태 전이 규칙은 `statusFlow.ts`에 유지한다.
- API route는 status/action 검증만 호출하고, 저장은 service/repository에 맡기는 구조가 좋다.
- 발주완료 이후 작업지시서 상태 반영은 별도 service로 분리해야 한다.

### 2. 자재 할당 / 발주 품목

핵심 파일:

- `features/material-orders/MaterialOrderAllocationPanel.tsx`
- `features/material-orders/components/MaterialOrderLineTable.tsx`
- `features/material-orders/materialOrderPanelUtils.ts`
- `lib/material-orders/materialOrderDraftCalculator.ts`
- `lib/material-orders/materialOrderDraftWorkspace.ts`
- `lib/material-orders/materialOrderWorkspaceViewModel.ts`

현재 위험 지점:

1. 우측 작업지시서 자재 선택과 중앙 발주 품목 테이블이 같은 draft 상태를 공유한다.
2. 수량/단가/공급처/자재명/단위가 PDF와 DB 저장에 모두 영향을 준다.
3. 작업지시서에서 입력한 원단·부자재 구성과 발주 품목 사이의 연결 기준이 더 명확해져야 한다.

리팩토링 원칙:

- 계산식은 UI 컴포넌트에서 빼고 calculator/view model 계층에 둔다.
- 자재 선택 가능 여부, 이미 선택됨, 완료/진행중 disabled 판정은 helper로 통일한다.
- 품목 row mutation은 hook 내부에서만 처리하고 table은 표시/입력 이벤트만 담당하게 한다.

### 3. 공급처 / 업체 / 품목 옵션

핵심 파일:

- `app/api/material-orders/suppliers/route.ts`
- `app/api/partners/workorder-options/route.ts`
- `lib/hooks/partners/usePartnerWorkOrderOptions.ts`
- `lib/material-orders/materialOrderWorkspaceClient.ts`

현재 위험 지점:

1. 공급처 조회 실패/재조회/선택 상태가 상세 패널에 직접 영향을 준다.
2. 협력업체 기준정보와 원단·부자재 발주 화면의 옵션이 계속 연결될 가능성이 높다.
3. 업체/품목 데이터의 company scope가 흔들리면 다른 회사 데이터 노출 위험이 있다.

리팩토링 원칙:

- companyId scope는 repository/API에서 반드시 검증한다.
- supplier option loading/error state는 UI 공통 state로 유지한다.
- 협력업체 화면과 발주 화면이 같은 option mapping helper를 쓰는 방향이 좋다.

## 고위험 영역

다음 영역은 기능 추가와 섞지 말고 별도 버전으로 분리해야 한다.

1. `lib/workorder/api/workOrderRouteHandlers.ts` 분해
2. `lib/workorder/persistence/dbAttachmentMemoRepository.ts` 분해
3. `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts` 수정
4. `app/api/workorders/attachments/upload/complete/route.ts` 수정
5. `lib/material-orders/repository.ts` 구조 변경
6. 작업지시서 상태 변경과 원단·부자재 발주완료 연결
7. 저장소 삭제/복원/purge와 첨부/디자인/메모 동시 변경
8. DB schema/full_reset.sql 변경

## 중위험 영역

다음 영역은 분석 후 작은 단위로 정리 가능하다.

1. `WorkOrderAttachmentPanel`, `WorkOrderMemoPanel` 내부 subcomponent 분리
2. `MaterialOrderLineTable` row component 분리
3. `useMaterialOrderDraftEditor` mutation helper 분리
4. `WorkOrderDetail*Section` 모바일/태블릿/PC 중복 구조 정리
5. PDF presentation 문구/테이블 구성 조정
6. 메모/첨부 API response type 정리

## 저위험 영역

다음 영역은 기능 추가 전 정리해도 비교적 안전하다.

1. 문서/QA 체크리스트 보강
2. barrel export/import 정리
3. adapter 이름 정렬
4. UI component prop 이름 정리
5. empty/loading/error 표시 문구 정리
6. icon-only button aria-label 정리
7. 화면별 test point 문서화

## 기능 추가 전 권장 순서

### 0.19.56

작업명: 기능 추가 전 안정화 QA 기준 정리

목표:

- 작업지시서 주요 흐름 테스트 항목 정리
- 원단·부자재 발주 주요 흐름 테스트 항목 정리
- 저장소/R2/첨부/메모 회귀 테스트 항목 정리
- 권한별 버튼 표시/서버 거부 테스트 항목 정리

### 0.19.57

작업명: 작업지시서/원단·부자재 저위험 분리 1차

목표:

- UI subcomponent 분리 위주
- action/persistence 로직 변경 금지
- 테스트하기 쉬운 표시 컴포넌트부터 정리

### 0.19.58 이후

작업명: 기능 추가 1차

우선순위:

1. 기존 화면의 작은 기능 보정
2. 작업지시서/원단·부자재 실제 업무 흐름 보정
3. 멤버/권한/탈퇴/비활성 기능
4. 환경설정 실제 기능
5. 시스템관리자 운영 기능
6. 결제/요금제/정책 기능

## 결론

UI 공통화는 기능 개발로 넘어갈 수 있는 수준까지 왔다. 다만 작업지시서와 원단·부자재 발주 영역은 앱의 핵심 도메인이고, 상태 전이와 저장 side effect가 많으므로 기능 추가 전에 최소 한 번 더 안정화 QA 기준을 잡는 것이 안전하다.

바로 기능 개발로 들어가야 한다면, 첫 기능은 DB/R2/PDF를 건드리지 않는 표시/버튼/문구/권한 표시 보정부터 시작하는 것이 적절하다.
