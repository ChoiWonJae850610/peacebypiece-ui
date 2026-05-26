Version : 0.17.6
Summary : 작업지시서 자재 연결 UI 제거
Description : 작업지시서 상세의 원단·부자재 기준정보 연결 패널과 작업지시서 기준 자재 연결 API/클라이언트 코드를 제거했습니다. 작업지시서는 생산 지시서 역할에 집중하고, 원단·부자재 발주와 작업지시서별 배분은 원단·부자재 발주 화면에서 처리하는 단방향 흐름으로 정리했습니다. dev/test-console용 full reset 이후 SQL 실행 순서 문서를 추가했습니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- lib/workorder/presentation/workOrderDetailSectionProps.ts
추가 파일 목록 :
- db/test/dev_test_console_reset_order.md
삭제 파일 목록 :
- app/api/workorders/material-lines/route.ts
- features/workorders/material-lines/WorkOrderMaterialLinesPanel.tsx
- features/workorders/material-lines/useWorkOrderMaterialLines.ts
- lib/materials/workorderMaterialLinesRepository.ts
- lib/materials/workorderMaterialLinesService.ts
