Version : 0.16.22
Summary : 원단·부자재 권한 조건 연결
Description : 원단·부자재 기준정보와 작업지시서 연결 패널에 서버 세션 기준 capability를 연결하고, 기준정보 관리/작업지시서 수정/발주 가능 권한에 따라 등록, 수정, 삭제, 연결, 발주 상태 변경 UI와 API 응답을 분리했습니다. 공통 capability helper를 추가했으며 DB schema, full_reset.sql, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- app/(workspace)/workspace/materials/page.tsx
- app/api/materials/route.ts
- app/api/workorders/material-lines/route.ts
- features/materials/MaterialsWorkspacePage.tsx
- features/workorders/material-lines/WorkOrderMaterialLinesPanel.tsx
- features/workorders/material-lines/useWorkOrderMaterialLines.ts
- lib/constants/app.ts
- lib/materials/types.ts
추가 파일 목록 :
- lib/materials/capabilities.ts
삭제 파일 목록 :
- 없음
