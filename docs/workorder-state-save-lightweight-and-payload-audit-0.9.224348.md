# 작업지시서 상태 저장 경량화와 payload 사용처 점검 — 0.9.224348

## 목적

0.9.224347 기준에서 검수 완료 후 `변경사항 저장 중입니다...` 메시지가 오래 유지되는 문제를 줄이기 위해 검수 완료/재고 반영 저장 범위를 축소했다.

## 확인한 병목

- 검수 완료와 재고 반영은 하나의 작업지시서 또는 같은 리오더 그룹의 재고 상태만 바뀌는 작업이다.
- 기존 흐름은 `applySharedInspectionComplete()` / `applySharedInventoryAdjustment()` 결과로 나온 전체 `workOrders` 배열을 `saveWorkOrdersAsync()`에 넘길 수 있었다.
- seed 기준 작업지시서가 120건 이상이면 전체 작업지시서 저장이 반복되고, `spec_sheets.payload` JSON 업데이트와 하위 동기화가 같이 발생해 저장 완료 표시가 늦어질 수 있다.

## 변경 내용

- 검수 완료 저장 대상은 현재 작업지시서와 같은 리오더 그룹에 속한 항목으로 제한했다.
- 재고 반영 저장 대상도 같은 기준으로 제한했다.
- 프론트 상태는 전체 목록을 즉시 갱신하되, DB 저장은 변경 후보만 수행한다.
- 서버 PATCH 처리에서 이전 상태 조회도 요청된 작업지시서 id만 대상으로 줄였다.

## payload 컬럼 판단

`spec_sheets.payload`는 현재 legacy/detail snapshot 성격으로 남아 있다. 즉시 제거하지 않는다.

현재 허용 범위:

- 상세 화면 구성을 위한 legacy fallback
- 아직 정규화 테이블에서 완전히 복원하지 못하는 draft/detail 보조값
- 생성/저장 시 필요한 기존 호환 구조

지양해야 할 범위:

- 상태 변경마다 전체 작업지시서 payload를 대량 저장하는 흐름
- 통계/검색/목록/상태 전환의 기준값을 payload에 의존하는 흐름
- `status`/`workflow_state`와 payload 내부 상태가 서로 다른 기준값이 되는 구조

## 다음 정리 후보

- `spec_sheets.payload` 의존 필드 목록 작성
- `orderEntries`, `materials`, `outsourcing`를 정규화 테이블에서 다시 hydrate할 수 있는지 확인
- 상태 변경 전용 PATCH API 분리 검토
- summary/detail query가 payload를 최소로 읽도록 보정

## 테스트 항목

1. 검수 완료 후 저장 중 메시지가 짧게 종료되는지 확인
2. 검수 완료 후 완료 상태로 전환되는지 확인
3. 재고 반영 후 같은 리오더 그룹만 저장되는지 확인
4. Network에서 검수 완료 시 전체 120건 저장이 발생하지 않는지 확인
5. 기존 작업지시서 상세 표시가 깨지지 않는지 확인
