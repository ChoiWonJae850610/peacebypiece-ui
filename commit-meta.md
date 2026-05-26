Version : 0.16.99
Summary : 원단·부자재 화면 3패널 shell 실제 적용
Description : 원단·부자재 route를 fixed workspace content mode로 전환하고 발주서 목록, 발주 상세, 작업지시서 연결 패널이 실제 PC 화면에서 가로 3패널로 배치되도록 flex 기반 shell로 수정했습니다. 기존 임의 grid arbitrary class 의존을 제거하고 패널별 고정/가변 폭과 내부 overflow를 명시했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/(workspace)/workspace/material-orders/page.tsx
- features/material-orders/MaterialOrderWorkspacePage.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
