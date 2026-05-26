Version : 0.16.98
Summary : 원단·부자재 발주 화면 전체 3패널 구조 정리
Description : 원단·부자재 업무 화면에서 상단 skeleton/요약 중심 구성을 제거하고 발주서 목록, 선택 발주서 상세/품목, 작업지시서 연결/배분 패널이 한 화면에 바로 보이도록 전체 route 본문을 3패널 구조로 재구성했습니다. 이후 리팩토링 부담을 줄이기 위해 목록/상세/배분 패널과 로컬 draft fixture를 별도 파일로 분리했습니다. DB 저장, 배분 API, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderWorkspacePage.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
추가 파일 목록 :
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- lib/material-orders/materialOrderDraftWorkspace.ts
삭제 파일 목록 :
- 없음
