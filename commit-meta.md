Version : 0.17.59
Summary : 진행단계 표시용 workflow_path 저장과 직행 발주 경로 강조 연결
Description : 작업지시서와 원단·부자재 발주서에 UI 표시용 workflow_path 값을 추가하고, 바로 발주요청 경로는 곡선 진행선을 강조하도록 연결했습니다. DB schema/full_reset 및 migration에 workflow_path 컬럼을 추가했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/WorkOrderActionSection.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- types/workorder.ts
- lib/material-orders/types.ts
- lib/material-orders/repository.ts
- lib/workorder/actions.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/repository/dbWorkOrderAssignmentBuilders.ts
- lib/workorder/repository/dbWorkOrderRepositoryTypes.ts
- lib/workorder/repository/dbWorkOrderReturningColumns.ts
- lib/workorder/repository/dbWorkOrderRowMappers.ts
- lib/workorder/repository/dbWorkOrderSchemaColumns.ts
- lib/workorder/repository/dbWorkOrderSchemaReader.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
- lib/workorder/repository/dbWorkOrderStatePatchAssignments.ts
- db/schema/full_reset.sql
- db/schema/materials_schema_draft.sql
- pending-tests.md
추가 파일 목록 :
- lib/constants/workflowPaths.ts
- db/migrations/patch_0_17_59_workflow_path.sql
삭제 파일 목록 :
- 없음
