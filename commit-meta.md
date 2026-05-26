Version : 0.17.1
Summary : 원단·부자재 3패널 가운데 작업 영역 확대
Description : 원단·부자재 발주 화면의 3패널 shell을 grid 기반 비율로 재정리하고 왼쪽 발주서 목록과 오른쪽 작업지시서 연결 패널을 보조 패널 폭으로 축소했습니다. 가운데 발주서 상세 패널이 남은 폭을 우선 사용하도록 조정하고 좌우 패널의 안내 문구와 내부 여백을 줄였습니다. 오른쪽 단계 안내 카드는 제거해 배분 후보 목록 중심으로 정리했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.
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
