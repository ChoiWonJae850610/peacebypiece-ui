# WAFL Mutation Runtime Contract 0.23.51

## 목적

작업지시서·발주서 저장에서 사용 중인 공통 mutation lifecycle을 다음 계약으로 확장한다.

- resource/document 단위 lock
- 요청 sequence/revision 발급
- 최신 응답만 상태 적용
- loading → success/error 동일 operation id 토스트
- 공통 오류 정규화
- 실패 범위 rollback
- success/error observer가 원본 mutation 결과를 덮지 않음

## 적용 내용

### useWaflMutation

- `WaflMutationContext`를 mutation callback에 전달한다.
- `sequenceKey`별 revision을 증가시킨다.
- 응답 시 최신 revision이 아니면 `onSuccess`와 success toast를 적용하지 않는다.
- `onSuccess`, `rollback`, `onError` lifecycle callback을 제공한다.
- lock은 기존처럼 `lockKey` 단위로 유지한다.

### 오류 정규화

`normalizeWaflMutationError`가 다음 값을 공통 구조로 변환한다.

- cause
- message
- code
- status

rollback과 오류 observer가 실패해도 최초 mutation 오류를 source of truth로 유지한다.

### WorkOrder feedback

작업지시서 feedback wrapper도 발주서와 동일하게 다음 옵션을 받을 수 있다.

- sequenceKey
- onSuccess
- rollback
- getErrorMessage

## 호환성

기존 `mutation: () => Promise<T>` 함수는 인자를 사용하지 않아도 되므로 호출부 변경 없이 호환된다.
기존 `runMutation` 반환 형식도 `Promise<T | undefined>`로 유지한다.

## 직접 테스트 누적

- 동일 lockKey 중복 저장 차단
- 서로 다른 lockKey지만 같은 sequenceKey를 사용하는 요청의 최신 응답 적용
- mutation 실패 시 optimistic state rollback
- API 오류 message/code/status 정규화
- rollback 또는 onError 내부 오류가 원본 오류를 대체하지 않는지 확인
