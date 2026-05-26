Version : 0.17.7
Summary : 원단·부자재 발주 상세 저장 연결
Description : 원단·부자재 발주 상세의 내부 메모와 품목 라인을 실제 material order API로 저장하도록 연결했습니다. PUT /api/material-orders를 추가하고 repository/service 계층에 draft 발주서 상세 저장 흐름을 분리했습니다. 저장 시 기존 품목 라인과 배분 초안을 정리한 뒤 현재 입력 라인을 다시 저장하고 총액을 재계산합니다. 발주서 목록과 선택 발주서는 저장 후 서버 응답 기준으로 갱신됩니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/material-orders/route.ts
- lib/material-orders/types.ts
- lib/material-orders/repository.ts
- lib/material-orders/service.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
