Version : 0.17.46
Summary : 원단·부자재 주문 패널 진행 단계 공통화와 레이아웃 구조 보정
Description : 작업지시서 진행 단계 구조를 공통 WorkflowProgressPanel로 분리하고 작업지시서와 원단·부자재 화면이 같은 진행 단계 패턴을 사용하도록 정리했습니다. 원단·부자재 중앙 패널은 flex 기반으로 재배치해 진행 단계와 구분/공급처는 고정 영역으로 두고, 주문 내역 테이블은 남은 공간을 채우며, 하단 요약은 footer 영역으로 고정되도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/WorkOrderActionSection.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
추가 파일 목록 :
- components/common/workflow/WorkflowProgressPanel.tsx
삭제 파일 목록 :
