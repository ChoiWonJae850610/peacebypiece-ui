# Workorder Inventory Patch Result Array — 0.23.42

## 목적

작업지시서 재고 조정과 검수 완료 시 여러 리오더 작업지시서를 저장한 뒤, 서버에서 반환된 전체 WorkOrder 객체로 로컬 상태를 교체하지 않도록 한다.

## 변경 원칙

- 다건 저장 결과는 `WorkOrder[]`가 아니라 `WorkOrderStatePatchResult[]`로 반환한다.
- 각 결과의 `resourceId`, `patch`, `updatedAt`만 기존 작업지시서 객체에 병합한다.
- 요청하지 않은 분류, 납기일, 담당자, 수량 등 기본정보는 교체하지 않는다.
- 재고 조정은 `inventoryQuantity`, `inventoryStatus`, `lastSavedAt` 중심으로 반영한다.
- 검수 완료는 서버가 실제 저장한 `orderEntries`와 재고 필드만 반영한다.
- DB 저장 완료까지 기존 `await` 및 문서 잠금 흐름을 유지한다.
- 실패 시 저장 전 작업지시서 목록으로 rollback한다.

## 영향 범위

- 재고 입고·조정·차감
- 리오더 그룹 공유 재고 동기화
- 검수 완료 후 재고 반영
- 작업지시서 로컬 상태, ref 상태, persisted 상태 동기화

## DB

신규 migration이나 full reset은 필요하지 않다. 기존 PATCH API와 컬럼을 사용한다.
