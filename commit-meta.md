Version : 0.17.65
Summary : 원단·부자재 부분 발주 잔여 수량 계산 1차
Description : 원단·부자재 발주 할당에 source_material_key를 저장하고 우측 작업지시서 자재 카드에서 필요/발주/잔여 수량을 표시하도록 정리합니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/material-orders/types.ts
- lib/material-orders/repository.ts
- lib/material-orders/materialOrderDraftCalculator.ts
- features/material-orders/hooks/useMaterialOrderDraftEditor.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/components/MaterialOrderLineTable.tsx
- features/material-orders/materialOrderPanelUtils.ts
- db/schema/full_reset.sql
- db/schema/materials_schema_draft.sql
- pending-tests.md

추가 파일 목록 :
- db/migrations/patch_0_17_65_material_order_source_material_key.sql

삭제 파일 목록 :
- 없음
