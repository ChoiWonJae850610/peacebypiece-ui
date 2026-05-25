# 80. 작업지시서 반려 생산구성 보존 보강

## 버전

- 0.15.57

## 목적

반려/취소/되돌리기 계열 workflow에서 작업지시서의 현재 생산구성이 삭제되거나 비활성화되는 문제를 막는다.

## 확인된 문제

- `spec_sheet_materials`, `spec_sheet_outsourcing_lines`는 0.15.48부터 현재값 replace 저장으로 전환되었다.
- `orders`는 기존 upsert + 불필요 row `is_active=false` 방식이 남아 있다.
- 생산구성을 직접 저장하려는 액션이 아닌데도 상세 snapshot이 없는 작업지시서 객체가 full save 경로를 타면, 빈 `orderEntries`, `materials`, `outsourcing` 값이 생산구성 sync 함수로 전달될 수 있다.
- 이 경우 다음 side effect가 발생할 수 있다.
  - `orders` 기존 row가 `is_active=false` 처리됨
  - `spec_sheet_materials` 기존 row가 replace 과정에서 삭제됨
  - `spec_sheet_outsourcing_lines` 기존 row가 replace 과정에서 삭제됨

## 수정 기준

작업지시서 full save 경로는 다음 조건 중 하나를 만족할 때만 생산구성 상세 테이블을 sync한다.

```txt
- workOrder.hasDetailSnapshot === true
- factoryOrderRequest가 있음
- orderEntries가 1개 이상 있음
- materials가 1개 이상 있음
- outsourcing이 1개 이상 있음
```

위 조건을 만족하지 않는 full save는 생산구성 상세 테이블을 건드리지 않는다.

## state patch 보존 기준

생산구성 patch가 없는 state patch는 `spec_sheets` 기본 필드만 갱신하고, 응답 WorkOrder에는 기존 DB 상세 생산구성을 다시 병합한다.

즉, 반려/취소/되돌리기 계열 workflow는 다음 데이터만 변경한다.

```txt
- workflow_state
- last_saved_at
- 필요 시 inventory 상태
- history/audit
```

다음 데이터는 변경하지 않는다.

```txt
- orders
- spec_sheet_materials
- spec_sheet_outsourcing_lines
- attachments
- memos
- R2 object
```

## 빌드 오류 수정

0.15.56에서 `state-patch:{serviceCode}` 문자열을 audit source에 직접 넣으면서 source union type과 충돌했다.

0.15.57에서는 audit source는 기존 허용값인 `state-patch`로 유지하고, serviceCode는 API meta와 별도 payload 기준으로 추적한다.

## 후속 작업

- `orders`도 `spec_sheet_id` 기준 replace 저장으로 전환할지 별도 작업에서 결정한다.
- production snapshot/history 테이블 도입 전까지 현재값 테이블은 반려/취소 계열에서 절대 변경하지 않는다.
