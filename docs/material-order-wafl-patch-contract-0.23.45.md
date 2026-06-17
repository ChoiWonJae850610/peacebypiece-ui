# Material Order WAFL PATCH Contract — 0.23.45

## 목적

발주서의 자재 종류, 공급처, 납기일, 상태 변경 결과를 전체 발주서 객체가 아닌 WAFL 공통 `WaflPatchResult`로 반환하고 병합한다.

## 공통 규칙

- 키 없음: 변경하지 않음
- `undefined`: 변경하지 않음
- `null`: 명시적 초기화
- 실제 값: 해당 값으로 변경
- 서버는 실제 저장된 필드만 `patch`에 포함한다.
- 클라이언트는 현재 완전한 발주서 객체에 `patch`만 병합한다.
- 부분 응답을 전체 `MaterialOrder`로 강제 변환하지 않는다.

## 헤더 변경

- 자재 종류 변경: `materialType`, 공급처 초기화, 금액 초기화, 품목 초기화 결과만 반환
- 공급처 변경: `supplierPartnerId`, `supplierPartnerName`만 반환
- 납기일 변경: `dueDate`만 반환

## 상태 변경

- `status`, `workflowPath`, `approvedByUserId`, `orderedAt`만 반환

## 상세 및 컬렉션

품목과 할당은 단일 필드 PATCH가 아니라 collection mutation으로 유지한다. 후속 버전에서 collection 결과 계약을 별도로 정리한다.
