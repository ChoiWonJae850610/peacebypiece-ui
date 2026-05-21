# 72. 생산구성 반려/취소성 workflow 보존 기준

## 버전

0.15.49

## 목적

`spec_sheet_materials`, `spec_sheet_outsourcing_lines`를 현재값 replace 저장 방식으로 전환한 뒤, 반려/취소성 workflow에서 원단·부자재·외주공정이 삭제되지 않도록 저장 경계를 명확히 한다.

## 기준

생산구성 현재값 replace 저장은 앞으로 진행되는 확정 이벤트에서만 수행한다.

- 검토요청
- 검토완료
- 발주요청/검수 단계 진입
- 완료

반대로 아래 흐름에서는 생산구성 replace 저장을 수행하지 않는다.

- 반려
- 검토요청 취소
- 검토완료 취소
- 상태만 되돌리는 흐름

이 경우 workflow 상태와 history만 저장하고, 기존 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`의 현재 row는 유지한다.

## 구현 메모

`buildWorkOrderStatePatch()`는 `shouldCommitProductionComposition()`이 true일 때만 `factoryOrderRequest`, `orderEntries`, `materials`, `outsourcing`을 patch에 포함한다.

`mergeStatePatchResultIntoWorkOrder()`는 repository 응답의 배열 존재 여부만 보지 않고, 실제 요청 patch에 해당 생산구성 필드가 포함되었는지를 기준으로 local state merge 여부를 결정한다.

이렇게 하면 반려처럼 생산구성 확정 저장 대상이 아닌 action에서 DB 응답의 빈 배열이 기존 화면 state를 덮어쓰지 않는다.

## 다음 단계

`orders` 테이블도 `spec_sheet_id` 기준 replace 저장으로 통일하되, 같은 저장 정책을 적용해야 한다.
