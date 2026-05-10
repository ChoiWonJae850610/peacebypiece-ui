# 0.9.224381 — 휴지통 진행 단계 표시 및 리오더 생성 pending 보정

## 목적

저장소/휴지통 회귀 테스트 중 발견된 두 가지 문제를 보정한다.

1. 작업지시서 휴지통 상세 모달에서 `검토완료` 단계가 첫 번째 단계처럼 표시되는 문제
2. 리오더 생성 후 `리오더 생성중입니다...` 상태가 오래 유지되는 문제

## 변경 내용

### 1. 휴지통 작업지시서 단계 표시

`components/admin/files/fileTrashSectionRows.ts`의 `WORKORDER_STAGE_STEPS`에서 `검토완료`와 `review_completed`를 검토 단계로 인식하도록 추가했다.

기존에는 `검토완료`가 단계 key 목록에 없어 `getWorkOrderStageIndex()`가 fallback index `0`을 반환했고, 이 때문에 실제 상태 문구는 `검토완료`인데 진행 바는 `작성중` 위치에 강조 표시될 수 있었다.

### 2. 리오더 생성 저장 범위 축소

`lib/hooks/workorder/useWorkOrderLifecycleActions.ts`의 리오더 생성 흐름에서 전체 작업지시서 목록을 `saveWorkOrdersAsync()`로 저장하던 흐름을 제거했다.

이제 리오더 생성 시에는 새로 생성된 리오더 작업지시서 1건만 `createWorkOrderAsync()` 경로로 저장하고, 성공 응답을 현재 목록 상단에 병합한다.

이 변경으로 리오더 생성 후 전체 목록 저장/병합 때문에 pending 상태가 오래 유지되는 문제를 줄인다.

## 유지한 정책

- 리오더 차수 계산은 기존 `cloneWorkOrderForReorder()` / `normalizeWorkOrdersReorderIdentity()` 결과를 사용한다.
- 기존 작업지시서 전체의 리오더 차수를 대량 재저장하지 않는다.
- 생성된 리오더 작업지시서는 선택 상태로 전환한다.
- 새 리오더의 상세 정보는 기존 lazy load 정책에 따라 필요 시 로딩한다.

## 테스트 기준

1. `/admin/files`에서 작업지시서 휴지통 상세 모달을 연다.
2. 삭제 당시 단계가 `검토완료`인 경우 진행 바가 두 번째 검토 단계에 표시되는지 확인한다.
3. `/worker`에서 리오더 생성을 실행한다.
4. `리오더 생성중입니다...`가 오래 지속되지 않는지 확인한다.
5. 새 리오더가 새로고침 없이 목록에 추가되는지 확인한다.
6. 새 리오더 선택 시 상세 lazy load가 정상 동작하는지 확인한다.
