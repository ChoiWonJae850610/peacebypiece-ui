Version : 0.17.49
Summary : 원단·부자재 3패널 공통 카드와 목록 spacing 정리
Description : 원단·부자재 화면의 좌측 발주서 목록, 중앙 주문 편집, 우측 작업지시서 목록이 같은 카드/목록/필터/빈 상태 spacing 규칙을 쓰도록 공통 스타일 상수를 추가하고 각 패널에 적용했습니다. 중앙 패널에서 먼저 적용한 공통 shell 기준을 좌측/우측 패널까지 확장하여 화면 전체의 카드 반경, 패딩, 목록 카드, 필터 입력, 빈 상태 톤을 맞췄습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
추가 파일 목록 :
- features/material-orders/materialOrderWorkspaceStyles.ts
삭제 파일 목록 :
