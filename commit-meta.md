Version : 0.17.2
Summary : 원단·부자재 3패널 레이아웃 강제 적용
Description : 원단·부자재 발주 화면의 패널 배치가 breakpoint/Tailwind arbitrary grid 적용 여부에 따라 세로로 떨어지지 않도록 inline gridTemplateColumns 기반의 고정 3패널 shell로 변경했습니다. 왼쪽 발주서 목록, 가운데 발주 상세, 오른쪽 작업지시서 연결 패널이 PC 화면에서 항상 같은 행에 배치되도록 하고, 각 패널의 높이/overflow를 명시했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
