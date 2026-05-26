Version : 0.17.16
Summary : 원단·부자재 발주 readiness 기반 정리
Description : 작업지시서의 표시 진행 단계는 유지하면서 원단·부자재 발주 후보 판단을 내부 readiness 유틸로 분리했습니다. 발주 후보 패널에 자재 발주 대기/진행중 라벨을 노출하고, 0.17.16 기준 설계 문서를 추가했습니다. DB 스키마와 기존 작업지시서/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
- lib/material-orders/materialOrderWorkspaceViewModel.ts
- features/material-orders/MaterialOrderAllocationPanel.tsx
추가 파일 목록 :
- lib/material-orders/materialOrderReadiness.ts
- docs/현재기준/0.17.16-material-order-readiness.md
삭제 파일 목록 :
- 없음
