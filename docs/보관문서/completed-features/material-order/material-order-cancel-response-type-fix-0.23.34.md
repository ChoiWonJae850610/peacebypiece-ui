# 0.23.34 발주서 취소 응답 타입 오류 수정

## 원인

0.23.33에서 발주서 상태 변경 API는 변경된 발주서 한 건만 반환하도록 `MaterialOrderWorkspaceSingleMutationResult`로 경량화되었습니다.

`cancelMaterialOrder`는 내부적으로 `updateMaterialOrderStatus`를 그대로 반환하지만 함수 선언은 기존 전체 목록 기반 `MaterialOrderWorkspaceMutationResult`로 남아 있었습니다.

이 때문에 TypeScript가 단건 응답에 `materialOrders` 속성이 없다고 판단해 Build가 실패했습니다.

## 수정

- `cancelMaterialOrder` 반환 타입을 `MaterialOrderWorkspaceSingleMutationResult`로 변경
- 실제 API 응답 및 내부 호출 함수의 반환 타입과 일치시킴
- 취소 호출부는 반환값을 사용하지 않으므로 런타임 동작 변화 없음
- DB/API 계약, 권한, 상태 전환 정책 변화 없음
