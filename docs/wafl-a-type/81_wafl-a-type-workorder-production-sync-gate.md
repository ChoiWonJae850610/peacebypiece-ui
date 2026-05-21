# 81. 작업지시서 생산구성 repository sync gate

Version : 0.15.58

## 목적

반려, 취소, 되돌리기 같은 backward workflow에서 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`가 비활성화되거나 삭제되는 흐름을 차단한다.

## 기준

- Full work-order save는 제목, 담당자, 분류, 재고 등 즉시 저장 필드용이다.
- Full work-order save는 생산구성 detail table을 동기화하지 않는다.
- 생산구성 replace 저장은 serviceCode가 허용된 state patch에서만 실행한다.
- `WO-B001`, `WO-B002`, `WO-B003` 계열은 생산구성 replace 저장을 할 수 없다.

## 적용 내용

- `shouldSyncProductionCompositionForFullWorkOrderSave()`를 false로 고정했다.
- `updateDbWorkOrderStatePatch()`는 production patch가 있더라도 `canServiceReplaceProductionComposition(serviceCode)`가 true일 때만 detail table sync를 실행한다.
- serviceCode가 없거나 backward serviceCode이면 기존 DB detail rows를 다시 병합해 반환한다.

## 기대 효과

- 반려 시 `orders.is_active = false` 또는 `deleted_at` 입력이 발생하지 않는다.
- 반려 시 원단/부자재/외주공정 row가 delete/replace되지 않는다.
- 검토요청, 검토완료, 발주요청 등 허용 serviceCode에서만 생산구성 현재값이 replace 저장된다.
