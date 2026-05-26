Version : 0.17.4
Summary : 원단·부자재 3패널 스크롤 영역 정리
Description : 원단·부자재 발주 화면에서 좌측 발주서 목록과 우측 작업지시서 연결/배분 목록만 패널 내부에서 스크롤되도록 정리하고, 가운데 선택 발주서 상세 패널은 스크롤 없이 화면 높이에 맞는 고정 작업 영역으로 압축했습니다. 가운데 패널의 메모 입력, 품목 테이블, 합계/버튼 영역을 compact하게 조정해 하단이 잘리지 않도록 보정했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.
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
