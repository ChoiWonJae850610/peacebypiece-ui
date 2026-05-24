Version : 0.16.20
Summary : 발주 이후 상태 설계 및 빌드 오류 보정
Description : 발주 요청 이후 작업지시서 상태, 원단·부자재 조달 상태, 발주 문서 상태를 분리하는 설계 문서를 추가했습니다. 0.16.19 빌드 실패 원인이던 WorkOrderMaterialLinesPanel.tsx 말미의 stray TS 텍스트를 제거하고 APP_VERSION을 0.16.20으로 갱신했습니다. DB schema, full_reset.sql, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- features/workorders/material-lines/WorkOrderMaterialLinesPanel.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/order-state-architecture.md
삭제 파일 목록 :
- 없음
