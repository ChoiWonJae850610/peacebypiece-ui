# 작업지시서 성능 병목 1차 정리 — 0.10.88

## 목적

작업지시서 화면의 초기 진입 속도를 먼저 줄이기 위해 목록 로딩과 상세 로딩을 분리한다.

## 확인된 구조

기존 DB 어댑터는 작업지시서 화면 진입 시 아래 요청을 하나의 초기 로딩 흐름 안에서 순차 처리했다.

1. `/api/workorders/summary`로 목록 요약 조회
2. 선택된 작업지시서의 `/api/workorders/{id}` 상세 조회
3. 두 결과를 병합한 뒤 화면 상태를 ready로 전환

이 구조에서는 목록이 이미 준비되어도 상세 조회가 끝나기 전까지 repository 초기화가 완료되지 않는다. 첨부, 메모, 생산구성 등 상세 데이터가 무거우면 작업지시서 개수가 많지 않아도 첫 화면이 느리게 보일 수 있다.

## 0.10.88 변경

- `loadWorkspaceState`는 목록 요약만 가져오도록 변경했다.
- 선택된 작업지시서 상세는 기존 `useWorkOrderCoreState`의 상세 지연 로딩 흐름에 맡긴다.
- `/api/workorders/summary`와 `/api/workorders/{id}` 응답 meta에 `durationMs`를 추가해 로컬 테스트 때 API 처리 시간을 바로 확인할 수 있게 했다.

## 기대 효과

- 작업지시서 목록은 상세 조회를 기다리지 않고 먼저 표시된다.
- 상세 영역은 선택된 작업지시서의 상세 snapshot이 로딩되는 동안 기존 로딩 상태를 사용한다.
- 이후 0.10.89에서 목록 API가 여전히 느린지, 상세 hydrate가 느린지 분리해서 판단할 수 있다.

## 다음 분석 지점

0.10.89에서는 아래를 확인한다.

1. `/api/workorders/summary`의 `meta.durationMs`
2. `/api/workorders/{id}`의 `meta.durationMs`
3. summary 응답 payload 크기
4. `spec_sheets.payload`에서 목록에 불필요한 큰 필드가 계속 파싱되는지
5. 목록 렌더링에서 `stabilizeWorkOrders`, `normalizeWorkOrderDataList`, derived 계산이 과도하게 반복되는지
6. 목록에는 DB 컬럼 기반 summary만 사용하고 상세 payload 파싱을 더 줄일 수 있는지
