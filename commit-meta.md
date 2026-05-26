Version : 0.17.8
Summary : 원단·부자재 공급처 실제 목록 연결
Description : 원단·부자재 발주 상세 화면의 공급처 선택을 실제 회사 협력업체 데이터로 연결했습니다. /api/material-orders/suppliers route를 추가하고 발주 종류가 원단이면 원단 공급처, 부자재면 부자재 공급처만 조회하도록 repository/service/client/UI 흐름을 분리했습니다. 선택한 공급처는 발주서 상세 저장 시 supplier_partner_id로 저장됩니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/material-orders/types.ts
- lib/material-orders/repository.ts
- lib/material-orders/service.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
추가 파일 목록 :
- app/api/material-orders/suppliers/route.ts
삭제 파일 목록 :
