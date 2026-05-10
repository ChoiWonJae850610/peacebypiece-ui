# 작업지시서 lazy load 1차 안정 체크포인트 (0.9.224354)

## 목적

0.9.224343부터 0.9.224353까지 진행한 작업지시서 목록/상세 로딩 분리, 상태 patch 경량화, 옵션 요청 캐시 보정을 1차 안정 체크포인트로 정리한다.

## 현재 구조

### 1. 첫 진입

- 작업지시서 화면 첫 진입 시 `/api/workorders/summary`를 먼저 호출한다.
- summary 응답은 `meta.mode = "summary"`, `meta.hydrated = false`를 기준으로 한다.
- summary는 목록 표시용 최소 정보 중심이며, 첨부/메모 상세 snapshot을 붙이지 않는다.

### 2. 상세 선택

- 작업지시서를 선택하면 필요한 경우 `/api/workorders/{id}`를 호출해 선택된 작업지시서 1건만 상세 hydrate한다.
- 상세 응답은 디자인, 첨부, 메모 thread 등 우측 패널 표시 데이터를 포함한다.
- 같은 작업지시서를 선택/해제하는 단순 반복에서는 불필요한 상세 GET이 과도하게 쌓이지 않는 것을 1차 기준으로 한다.
- 다른 작업지시서를 선택했다가 이전 작업지시서로 돌아올 때 상세 GET이 다시 발생하는 것은 현재 단계에서는 허용한다.

### 3. 상태 변경

- 검수 완료, 워크플로우 상태 변경, 재고 반영 계열 저장은 전체 작업지시서 저장이 아니라 상태 patch 경로를 사용한다.
- `PATCH /api/workorders/{id}` 응답은 전체 `workOrder`가 아니라 `patch` 중심으로 반환한다.
- 상태 patch 응답에는 `attachments`, `memoThreads`를 포함하지 않는다.
- 상태 patch 응답의 `meta.mode`는 `state-patch`, `meta.hydrated`는 `false`다.
- 프론트는 patch 결과를 기존 row/detail에 부분 병합한다.
- patch 병합 과정에서 이미 로딩된 상세 snapshot을 `false`로 덮어쓰지 않는다.

### 4. 옵션 데이터

- `/api/partners/workorder-options`는 작업지시서 선택마다 반복 호출하지 않도록 hook 단에서 cache한다.
- module-level cache와 in-flight promise 공유를 사용한다.
- 현재 TTL은 5분이다.

## 현재 허용하는 동작

- 작업지시서가 처음 선택될 때 상세 GET이 발생하는 것은 정상이다.
- 첨부 이미지/PDF 표시를 위해 `attachments/file?key=...` 요청이 발생하는 것은 정상이다.
- 다른 작업지시서를 선택했다가 이전 작업지시서로 돌아올 때 상세 GET이 다시 발생할 수 있다. 이 동작은 현재 단계에서 허용한다.
- R2 더미 파일이 없거나 thumbnail key가 없는 경우 첨부 file 요청이 실패할 수 있다. 이는 lazy load 구조 자체의 실패로 보지 않는다.

## 1차 안정 기준

다음 조건을 만족하면 작업지시서 lazy load 구조는 1차 안정으로 판단한다.

1. `/worker` 첫 진입이 기존 전체 hydrate 방식보다 체감상 가볍다.
2. 첫 진입 시 `/api/workorders/summary`가 먼저 호출된다.
3. 선택한 작업지시서에 대해서만 `/api/workorders/{id}` 상세 GET이 발생한다.
4. 같은 작업지시서를 선택/해제 반복해도 상세 GET이 계속 쌓이지 않는다.
5. `/api/partners/workorder-options`가 선택마다 반복 호출되지 않는다.
6. 검수 완료 시 `/api/workorders/{id}` PATCH가 호출된다.
7. 상태 patch 응답에 `workOrder`, `attachments`, `memoThreads`가 포함되지 않는다.
8. 검수 완료 후 `변경사항 저장 중입니다...`가 무한 지속되지 않는다.
9. 메모, 디자인, 첨부 표시가 기존처럼 유지된다.
10. 작업지시서 저장/상태 변경 후 선택된 상세 화면이 깨지지 않는다.

## 남은 개선 후보

### 상세 cache 강화

다른 작업지시서를 선택했다가 이전 작업지시서로 돌아올 때 상세 GET을 줄이는 cache 전략은 추후 보완할 수 있다. 다만 stale data 문제가 생길 수 있으므로 메모/첨부/상태 변경 후 무효화 기준을 먼저 정해야 한다.

### DB 튜닝

현재는 API 구조 개선이 우선이다. 추후 작업지시서 수가 늘어나면 다음 인덱스 후보를 검토한다.

- `spec_sheets(company_id)`
- `spec_sheets(is_active, deleted_at)`
- `spec_sheets(workflow_state)`
- `spec_sheets(updated_at)`
- `attachments(work_order_id)` 또는 현재 연결 컬럼 기준 인덱스
- `memos(work_order_id)` 또는 현재 연결 컬럼 기준 인덱스

### payload 축소

`spec_sheets.payload`는 legacy/detail snapshot 성격으로 남아 있으나, 핵심 상태/통계/검색 기준으로 사용하지 않는 방향이 맞다. payload 제거 또는 축소는 DB schema 정리 단계에서 별도 진행한다.

## 다음 진행

이 체크포인트 이후에는 저장소/휴지통 회귀 테스트로 복귀한다.

권장 다음 버전:

- 0.9.22435 — 저장소/휴지통 회귀 테스트 1차
