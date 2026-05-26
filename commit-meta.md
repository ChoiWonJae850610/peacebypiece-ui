Version : 0.17.5
Summary : 원단·부자재 실제 발주서 목록 연결
Description : 원단·부자재 화면의 왼쪽 발주서 목록을 mock 데이터에서 실제 /api/material-orders 조회 기반으로 전환하고 새 발주 버튼으로 draft 발주서를 DB에 생성하도록 연결했습니다. 우측 작업지시서 연결 후보도 /api/workorders 실제 조회 결과를 표시하도록 변경했습니다. 기존 예시 발주서/예시 작업지시서/예시 공급처 목록 의존을 제거하고, 데이터가 없을 때는 빈 상태와 재조회 UI를 표시하도록 정리했습니다. DB schema, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderWorkspacePage.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- lib/material-orders/materialOrderDraftWorkspace.ts
추가 파일 목록 :
- lib/material-orders/materialOrderWorkspaceClient.ts
삭제 파일 목록 :
- 없음
