Version :
0.15.37

Summary :
작업지시서 workflow action type 상수화 1차 정리

Description :
작업지시서 workflow action type 문자열 literal을 공통 상수로 분리하고 policy, action, hook, detail action section에서 직접 문자열 비교를 줄였다. WorkflowAction 타입도 공통 action type 값으로 참조하도록 정리했다.

수정 파일 목록 :
- types/workflow.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/actions.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- components/workorder/detail/WorkOrderActionSection.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- lib/constants/workflowActions.ts
- docs/wafl-a-type/60_wafl-a-type-workorder-action-type-constants.md

삭제 파일 목록 :
없음
