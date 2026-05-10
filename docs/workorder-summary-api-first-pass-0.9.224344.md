# 0.9.224344 — 작업지시서 목록 API 1차 구현

## 목표

작업지시서 화면의 첫 진입 병목을 줄이기 위해 기존 전체 상세 조회 API와 별개로 목록 전용 summary API를 추가한다.

이번 버전에서는 기존 `/api/workorders` 응답을 변경하지 않는다. 기존 화면 동작을 깨지 않기 위해 `/api/workorders/summary`를 새로 추가하고, 다음 버전에서 프론트 어댑터가 이 API를 우선 사용하도록 전환한다.

## 추가된 API

```text
GET /api/workorders/summary
```

응답 구조:

```ts
{
  workOrders: WorkOrderSummary[];
  meta: {
    mode: "summary";
    hydrated: false;
    count: number;
  };
}
```

## summary API의 성격

`/api/workorders/summary`는 다음을 하지 않는다.

- 첨부 snapshot hydrate
- 메모 thread hydrate
- 작업지시서별 첨부/메모 개별 조회
- 기존 `/api/workorders` 응답 포맷 변경

따라서 첫 목록 로딩용으로 사용할 수 있고, 선택된 작업지시서 상세는 다음 단계에서 별도 detail API로 lazy load하는 것이 목표다.

## 이번 버전의 수정 범위

- `types/workorder.ts`
  - `WorkOrderSummary` 타입 추가
- `lib/workorder/repository/dbWorkOrderRepository.ts`
  - `findDbWorkOrderSummaries()` 추가
  - 기존 active spec sheet row 조회 SQL을 공통 함수로 정리
- `lib/workorder/api/workOrderRouteHandlers.ts`
  - `handleGetWorkOrderSummaries()` 추가
- `app/api/workorders/summary/route.ts`
  - summary GET route 추가

## 다음 단계

0.9.224345에서 프론트 DB adapter가 다음 흐름으로 전환된다.

```text
첫 진입:
/api/workorders/summary

작업지시서 선택:
/api/workorders/[id] 또는 detail route
```

## 로컬 확인

```powershell
npm run build
```

추가 확인:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/workorders/summary" -Method GET
```

확인 포인트:

- 응답에 `meta.mode = "summary"`가 있는지 확인
- `meta.hydrated = false`인지 확인
- 기존 `/api/workorders`가 그대로 동작하는지 확인
- 작업지시서 화면이 아직 기존 방식으로 정상 진입하는지 확인
