Version : 0.11.74
Summary : 작업지시서 목록 필터 선택 상태 회귀 보정
Description : 작업지시서 검색/필터/정렬 변경 후 현재 선택 항목이 표시 목록에서 사라질 때 첫 번째 표시 작업지시서를 자동 선택하도록 보정하고, 왼쪽 목록 선택 시 workOrderId query를 유지하도록 정리했습니다. 같은 항목 재클릭으로 선택이 해제되는 동작을 막아 상세/첨부·메모 패널이 비는 상황을 줄였습니다.
수정 파일 목록 :
- lib/hooks/useWorkOrder.ts
- components/workorder/WorkOrderWorkspace.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-list-filter-sort-regression-0.11.74.md
삭제 파일 목록 :
