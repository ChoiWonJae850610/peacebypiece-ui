Version : 0.17.75
Summary : 원단·부자재 상태 전환 후 자재 요약 재조회 흐름 보정
Description : 발주서 상태 변경 후 작업지시서 후보 재조회가 완료된 뒤 상태 변경 메시지를 표시하도록 조정하고, 자재 수량 계산 유틸의 중복 타입 필드를 제거해 컴파일 안정성을 보정했습니다.
수정 파일 목록 :
- features/material-orders/hooks/useMaterialOrderDraftEditor.ts
- features/material-orders/materialOrderPanelUtils.ts
- lib/constants/app.ts
추가 파일 목록 :
삭제 파일 목록 :
