# 0.9.224352 — 작업지시서 상태 patch 응답 경량화

## 목적

0.9.224350에서 추가한 상태 변경 전용 `PATCH /api/workorders/{id}` 경로가 실제 응답에서는 상세 작업지시서 객체를 반환하고 있었다. 이 때문에 상태 변경 후 `attachments`, `memoThreads`가 섞인 큰 응답이 내려오고, 동시에 `hasDetailSnapshot` 값이 `false`로 남아 상세 lazy load가 다시 발생할 수 있었다.

이번 버전에서는 상태 변경 응답을 최소 patch 결과로 축소한다.

## 변경 원칙

- 상태 변경 API는 상세 hydrate를 하지 않는다.
- 응답에 `attachments`, `memoThreads`를 포함하지 않는다.
- 응답 `meta.hydrated`는 `false`로 둔다.
- 프론트는 현재 보유 중인 작업지시서 상세 상태를 유지한 채 상태 관련 필드만 병합한다.
- `hasDetailSnapshot`은 상태 patch 응답으로 덮어쓰지 않는다.

## 기대 효과

- 검수 완료 후 불필요한 상세 재호출 가능성 감소
- 상태 변경 후 저장 중 메시지 지연 완화
- 작업지시서 선택 시 네트워크 요청 증가 완화
- payload 상세 snapshot과 상태 patch 응답의 역할 분리

## 확인 항목

1. 검수 완료 클릭 시 `/api/workorders/{id}` PATCH가 호출되는지 확인한다.
2. PATCH 응답에 `patch`가 있고 `workOrder.attachments`, `workOrder.memoThreads`가 없는지 확인한다.
3. 응답 `meta.mode`가 `state-patch`인지 확인한다.
4. 응답 `meta.hydrated`가 `false`인지 확인한다.
5. 상태 변경 후 이미 로딩된 첨부/메모가 화면에서 사라지지 않는지 확인한다.
6. 상태 변경 후 `/api/workorders/{id}` 상세 재호출이 과도하게 발생하지 않는지 확인한다.
