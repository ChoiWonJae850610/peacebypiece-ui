Version : 0.17.10
Summary : 원단·부자재 발주 화면 상태/필터 정리
Description : 원단·부자재 화면의 상단 안내 카드를 제거해 3패널 영역을 확대하고, 발주서 목록에 검색/종류/상태 필터와 상태 뱃지를 정리했습니다. 선택 발주서 상세에는 작성중-검토요청-발주확정-발주완료 상태 흐름과 상태 변경 버튼을 추가했습니다. 우측 작업지시서 연결 목록은 발주요청 상태의 실제 작업지시서 summary 조회를 사용하고, workspace scope에 따라 관리자는 회사 전체, 일반 멤버는 본인 담당 범위만 보도록 유지했습니다. material order 목록도 일반 멤버는 본인이 요청한 발주서만 조회하도록 visibility scope를 반영했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/material-orders/route.ts
- features/material-orders/MaterialOrderWorkspacePage.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- lib/material-orders/types.ts
- lib/material-orders/repository.ts
- lib/material-orders/service.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
