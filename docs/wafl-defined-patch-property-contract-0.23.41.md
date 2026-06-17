# WAFL defined PATCH property contract — 0.23.41

## 목적
작업지시서 단일 필드 PATCH에서 요청하지 않은 필드가 `undefined` 키로 포함되어 SQL UPDATE 대상이 되는 회귀를 차단한다.

## 공통 규칙
- 키가 없으면 변경하지 않는다.
- 값이 `undefined`이면 변경하지 않는다.
- 값이 `null`이면 명시적 초기화로 처리한다.
- 실제 값이 있으면 해당 값으로 변경한다.

## 적용 계층
1. API route는 실제 변경된 필드만 `WorkOrderStatePatch` 객체에 포함한다.
2. Repository SQL assignment builder는 값이 `undefined`인 키를 UPDATE 대상에서 제외한다.
3. 클라이언트 PATCH 응답은 요청 필드만 반환·병합한다.

## 기대 결과
- 납기일 변경 시 담당자·분류·수량·재고는 UPDATE되지 않는다.
- 담당자 변경 시 납기일·분류·수량·재고는 UPDATE되지 않는다.
- 재고 변경 시 담당자·납기일·분류·수량은 UPDATE되지 않는다.
- 분류 변경 시 담당자·납기일·수량·재고는 UPDATE되지 않는다.
- `null`을 명시한 필드만 정상적으로 초기화된다.

## DB
스키마 변경과 Migration은 없다.
