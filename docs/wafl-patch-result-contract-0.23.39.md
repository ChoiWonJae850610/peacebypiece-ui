# WAFL 공통 PATCH 결과 계약 — 0.23.39

## 목적
작업지시서·발주서·향후 모든 WAFL 저장 화면에서 부분 PATCH 응답을 전체 리소스 객체로 오인하지 않도록 프로젝트 공통 결과 계약을 도입한다.

## 공통 계약
`WaflPatchResult<TPatch>`는 다음 값만 전달한다.

- `resourceId`: 변경된 리소스 ID
- `patch`: 실제 저장된 필드만 포함하는 부분 결과
- `updatedAt`: DB 저장 완료 시각
- `revision`: 향후 낙관적 잠금에 사용할 선택 값

부분 응답을 `as WorkOrder`, `as MaterialOrder`처럼 전체 객체로 강제 변환하지 않는다.

## 공통 적용 유틸
`applyWaflPatchResult`는 현재의 완전한 화면 객체 위에 허용된 필드만 병합한다. 저장 요청에 포함되지 않은 담당자·납기일·분류·수량·재고 등의 값은 변경하지 않는다.

## 이번 버전 적용 범위
- WAFL 공통 PATCH 결과 타입과 병합 유틸 추가
- 작업지시서 repository/adapter/API를 공통 결과 계약으로 전환
- 작업지시서 API가 요청받은 필드와 `lastSavedAt`만 반환
- 부분 PATCH 응답을 전체 `WorkOrder`로 강제 캐스팅하던 경로 제거
- 클라이언트가 요청 필드만 현재 WorkOrder에 병합하도록 변경

## 후속 적용
- 0.23.40: 작업지시서 재고·리오더 그룹 PATCH 및 모든 저장 경로 통합
- 0.23.41: 발주서 헤더·상태·품목·할당 응답을 같은 공통 계약으로 전환
- 이후 DB 변경 화면을 순차적으로 공통 계약에 편입

## DB
스키마 변경과 Migration은 없다.
