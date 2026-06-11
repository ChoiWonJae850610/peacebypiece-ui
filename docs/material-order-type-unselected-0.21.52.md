# 0.21.52 원단·부자재 발주 자재 종류 미선택 상태 보정

## 목적

새 발주서를 생성한 직후 목록 카드에는 `미지정`으로 보이지만, 상세 패널을 열면 자재 종류가 `원단`으로 자동 선택되어 우측 작업지시서 카드가 노출되는 흐름을 보정한다.

## 기준

- 새 발주서 생성 직후 자재 종류는 `선택 안함` 상태로 둔다.
- `선택 안함` 상태에서는 공급처 선택을 비활성화한다.
- `선택 안함` 상태에서는 우측 작업지시서 자재 카드가 표시되지 않는다.
- 사용자가 `원단` 또는 `부자재`를 직접 선택한 뒤에만 우측 카드가 열린다.
- `원단 ↔ 부자재 ↔ 선택 안함` 전환 시 기존 공급처와 발주 품목은 초기화한다.

## 수정 파일

- `lib/material-orders/materialOrderDraftCalculator.ts`
- `lib/material-orders/materialOrderWorkspaceClient.ts`
- `features/material-orders/hooks/useMaterialOrderDraftEditor.ts`
- `features/material-orders/MaterialOrderDetailPanel.tsx`
- `features/material-orders/MaterialOrderAllocationPanel.tsx`
- `features/material-orders/MaterialOrderListPanel.tsx`
- `lib/constants/version.ts`
