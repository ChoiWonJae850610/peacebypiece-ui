# 작업지시서 목록/상세 로딩 분리 설계 — 0.9.224343

## 목적

작업지시서 화면 진입 시 전체 작업지시서와 각 작업지시서의 첨부/메모 snapshot을 한 번에 읽는 구조를 목록 우선 로딩과 선택 항목 상세 lazy load 구조로 분리한다.

이번 버전은 설계 확정 단계이며, 실제 API 응답 구조 변경은 다음 구현 버전에서 진행한다.

## 현재 확인된 병목

현재 `/api/workorders` GET 흐름은 다음과 같다.

1. `handleGetWorkOrders()`가 `findAllDbWorkOrders()`를 호출한다.
2. `findAllDbWorkOrders()`는 활성 작업지시서 전체를 조회한다.
3. `hydrateWorkOrdersWithAttachmentMemoSnapshots()`가 전체 작업지시서 각각에 대해 `repository.listSnapshotByWorkOrderId(workOrder.id)`를 호출한다.
4. 응답은 `{ workOrders }` 하나로 반환된다.
5. `createDbWorkorderHttpAdapter().loadWorkspaceState()`는 이 전체 응답을 받아 workspace state를 조립한다.

이 구조는 작업지시서 수와 첨부/메모 수가 늘어날수록 첫 진입 시간이 급격히 증가한다.

## 유지해야 할 원칙

- 기존 `/api/workorders` 저장/수정/삭제 흐름을 한 번에 바꾸지 않는다.
- 첨부/메모/R2/휴지통/삭제 요청 흐름은 영향 범위를 확인한 뒤 단계적으로 분리한다.
- TSX 내부에서 데이터 판정 로직을 늘리지 않는다.
- 목록용 데이터와 상세용 데이터의 타입을 분리한다.
- 기존 `WorkOrder` 전체 타입을 목록 전용 응답에 그대로 쓰지 않는다.
- 목록에서 필요한 badge/상태 값은 서버 또는 selector 계층에서 계산한다.
- 선택한 작업지시서만 첨부/메모 snapshot을 hydrate한다.

## 제안 API 구조

### 1. 목록 API

후보 경로:

```text
GET /api/workorders/summary
```

역할:

- 작업지시서 목록에 필요한 최소 필드만 반환한다.
- 첨부/메모 본문은 반환하지 않는다.
- 화면 첫 진입에서 사용한다.

응답 예시:

```ts
type WorkOrderSummary = {
  id: string;
  title: string;
  workflowState: WorkOrder["workflowState"];
  workOrderKind?: WorkOrder["workOrderKind"];
  managerId?: string | null;
  manager?: string | null;
  lastSavedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  dueDate?: string | null;
  orderQuantity?: number | null;
  reorderGroupId?: string | null;
  reorderRound?: number | null;
  parentSpecSheetId?: string | null;
  isRework?: boolean | null;
  category1Id?: string | null;
  category2Id?: string | null;
  category3Id?: string | null;
  attachmentCount?: number;
  memoThreadCount?: number;
};

type WorkOrderSummaryResponse = {
  workOrders: WorkOrderSummary[];
};
```

### 2. 상세 API

후보 경로:

```text
GET /api/workorders/detail?id={workOrderId}
```

또는 Next route segment 기준:

```text
GET /api/workorders/[id]
```

역할:

- 선택한 작업지시서 1건만 상세 조회한다.
- 선택한 작업지시서에 대해서만 첨부/메모 snapshot을 hydrate한다.
- 기존 상세 화면, 첨부 영역, 메모 영역은 이 응답을 기준으로 렌더링한다.

응답 예시:

```ts
type WorkOrderDetailResponse = {
  workOrder: WorkOrder;
};
```

## Repository 분리안

현재:

```text
findAllDbWorkOrders()
→ 전체 spec_sheets 조회
→ mapSpecSheetRowToWorkOrder()
```

추가 제안:

```text
findDbWorkOrderSummaries()
→ 목록 필드만 조회
→ 첨부/메모 count만 join 또는 별도 집계

findDbWorkOrderById(id)
→ 단일 spec_sheet 조회
→ mapSpecSheetRowToWorkOrder()
→ hydrateWorkOrderWithAttachmentMemoSnapshot()
```

주의:

- `findAllDbWorkOrders()`는 저장/일괄 갱신/기존 API 호환 용도로 당분간 유지한다.
- 기존 호출부를 한 번에 치환하지 않는다.
- 요약 조회에서 payload 전체를 파싱해야만 얻는 필드는 단계적으로 payload 정규화 또는 fallback 기준을 둔다.

## 프론트 전환안

현재:

```text
loadWorkspaceState()
→ /api/workorders GET
→ 전체 WorkOrder[] state 저장
→ selectedId 결정
```

전환 후:

```text
loadWorkspaceState()
→ /api/workorders/summary GET
→ WorkOrderSummary[] 저장
→ selectedId 결정
→ selectedId 상세 요청
→ 선택된 WorkOrder detail cache 저장
```

상태 구조 후보:

```ts
type WorkorderWorkspaceState = {
  workOrderSummaries: WorkOrderSummary[];
  selectedId: string;
  selectedWorkOrder?: WorkOrder | null;
  workOrderDetailsById?: Record<string, WorkOrder>;
  detailLoadingById?: Record<string, boolean>;
};
```

기존 state 구조와의 호환이 필요하면 1차 구현에서는 adapter 내부에서 다음처럼 다리 구조를 둔다.

```text
summary 목록 → 기존 화면 목록용 최소 WorkOrder 형태로 변환
selected detail → 같은 id의 WorkOrder를 detail로 교체
```

## 변경 영향 범위

반드시 확인해야 하는 흐름:

1. 작업지시서 첫 진입
2. 목록 선택 변경
3. 새 작업지시서 생성
4. 작업지시서 저장
5. 상태 변경
6. 리오더 생성
7. 디자인/첨부 업로드
8. 메모 작성/수정/삭제
9. 작업지시서 삭제
10. 휴지통 이동 이후 목록 반영
11. 통계 seed 데이터가 많을 때 첫 진입 속도

## 단계별 구현 계획

### 0.9.224344 — 목록 API 1차 구현

- `WorkOrderSummary` 타입 추가
- `findDbWorkOrderSummaries()` 추가
- `/api/workorders/summary` 추가
- 기존 `/api/workorders` GET은 유지
- UI 연결 전, API 단독 확인

### 0.9.224345 — 상세 API 1차 구현

- `findDbWorkOrderById(id)` 추가
- `/api/workorders/detail?id=` 또는 `/api/workorders/[id]` 추가
- 선택한 작업지시서 1건만 첨부/메모 hydrate
- 기존 저장/삭제 API 유지

### 0.9.224346 — 프론트 lazy load 연결

- `dbWorkorderHttpAdapter.loadWorkspaceState()`를 summary 우선 로딩으로 전환
- selectedId 상세만 로딩
- 선택 변경 시 detail cache miss일 때 상세 API 호출
- 상세 로딩 skeleton 또는 상태 문구 표시

### 0.9.224347 — 회귀 테스트

- 생성/저장/상태 변경/리오더/첨부/메모/삭제 흐름 확인
- seed 데이터 100건 이상에서 첫 진입 체감 확인
- `/admin/files`와 `/admin/dashboard` 영향 없음 확인

## 이번 설계의 완료 판단

- 첫 진입 API와 상세 API를 분리하는 방향이 확정된다.
- 기존 `/api/workorders` 전체 응답은 바로 제거하지 않는다.
- 다음 버전에서 목록 API를 안전하게 추가할 수 있다.
- seed/R2 매칭 데이터가 많아져도 작업지시서 화면 테스트가 가능하도록 전환 경로가 생긴다.
