Version : 0.17.62
Summary : 원단·부자재 패널 검색과 메시지 표시 로직 정리
Description : 원단·부자재 발주서 목록/작업지시서 패널의 검색·필터·빈 상태 표시 로직을 공통 유틸과 메시지 컴포넌트로 분리하고, 사용하지 않는 guideItems prop 전달을 제거했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderWorkspacePage.tsx
- pending-tests.md

추가 파일 목록 :
- features/material-orders/components/MaterialOrderPanelMessage.tsx
- features/material-orders/materialOrderPanelUtils.ts

삭제 파일 목록 :
- 없음
