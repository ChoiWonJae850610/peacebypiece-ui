# 0.9.224350 — 작업지시서 상태 변경 최소 patch API 설계

## 목적

작업지시서 검수 완료, 검토 요청, 발주 요청, 재검수 요청 같은 상태 변경을 전체 작업지시서 저장 경로에서 분리한다.

기존 전체 저장 경로는 `spec_sheets.payload` 전체 갱신, factory/material/outsourcing 동기화, 상세 hydrate가 함께 엮일 수 있어 상태 변경만 필요한 액션에는 과하다. 이 버전은 상태 변경에 필요한 최소 필드만 업데이트하는 전용 patch 경로를 추가한다.

## 추가된 경로

```http
PATCH /api/workorders/{workOrderId}
```

요청 body:

```json
{
  "patch": {
    "id": "realistic-spec-906",
    "workflowState": "completed",
    "lastSavedAt": "2026-05-10T11:55:00.000Z",
    "inventoryQuantity": 120,
    "inventoryStatus": "completed",
    "orderEntries": []
  }
}
```

응답 body:

```json
{
  "workOrder": {},
  "meta": {
    "mode": "state-patch",
    "hydrated": true
  }
}
```

## 저장 범위

상태 patch는 아래 필드만 다룬다.

- `workflowState`
- `lastSavedAt`
- `inventoryQuantity`
- `inventoryStatus`
- `factoryOrderRequest`
- `orderEntries`

`spec_sheets.workflow_state`, `spec_sheets.last_saved_at` 컬럼이 있으면 컬럼을 우선 갱신한다. `payload`가 json/jsonb/text JSON이면 위 key만 부분 갱신한다. 작업지시서 전체 payload를 다시 직렬화하지 않는다.

## 의도적으로 하지 않은 것

- `spec_sheets.payload` 컬럼 삭제
- DB schema 변경
- 전체 `/api/workorders` PATCH 제거
- 일반 입력 필드 저장 경로 변경
- factory/material/outsourcing 동기화 강제 실행

## 검증 포인트

1. 검수 완료 클릭 시 `/api/workorders/{id}` PATCH가 호출되는지 확인한다.
2. 기존 `/api/workorders` PATCH가 검수 완료마다 호출되지 않는지 확인한다.
3. 요청 body가 전체 작업지시서가 아니라 `patch` 중심인지 확인한다.
4. 검수 완료 후 상태가 `completed`로 바뀌는지 확인한다.
5. `변경사항 저장 중입니다...` 표시 시간이 줄어드는지 확인한다.
6. 메모/첨부/상세 표시가 기존처럼 유지되는지 확인한다.

## 남은 작업

상태 변경 patch가 안정화되면 다음 단계에서 `spec_sheets.payload`의 남은 의존성을 줄인다. 핵심 컬럼과 정규화 테이블로 이동 가능한 값은 payload 기준에서 제거하는 방향이 맞다.
