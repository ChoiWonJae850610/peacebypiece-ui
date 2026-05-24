Version : 0.16.21
Summary : 원단·부자재 발주 상태 연결
Description : 작업지시서에 연결된 원단·부자재 항목의 발주 상태를 변경할 수 있도록 PATCH API, service, repository, 클라이언트 컨트롤러, 상태 선택 UI를 연결했습니다. 발주 상태 배지 톤을 중앙 상수로 분리했으며 DB schema, full_reset.sql, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- app/api/workorders/material-lines/route.ts
- features/workorders/material-lines/WorkOrderMaterialLinesPanel.tsx
- features/workorders/material-lines/useWorkOrderMaterialLines.ts
- lib/constants/app.ts
- lib/materials/constants.ts
- lib/materials/workorderMaterialLinesRepository.ts
- lib/materials/workorderMaterialLinesService.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
