Version : 0.16.19
Summary : 작업지시서 원단·부자재 연결 1차
Description : 작업지시서 상세 생산구성 영역에서 /workspace/materials 기준정보를 조회하고 workorder_material_lines에 연결/해제할 수 있는 API, service, repository, 클라이언트 패널을 추가했습니다. 기존 작업지시서 내부 생산구성 편집, 발주 상태 연결, R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- lib/constants/app.ts
- lib/materials/constants.ts
- lib/materials/types.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
추가 파일 목록 :
- app/api/workorders/material-lines/route.ts
- features/workorders/material-lines/WorkOrderMaterialLinesPanel.tsx
- features/workorders/material-lines/useWorkOrderMaterialLines.ts
- lib/materials/workorderMaterialLinesRepository.ts
- lib/materials/workorderMaterialLinesService.ts
삭제 파일 목록 :
- 없음
