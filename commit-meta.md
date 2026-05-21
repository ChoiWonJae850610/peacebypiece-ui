Version :
0.15.36

Summary :
작업지시서 workflow 상태값 사용 기준 1차 정리

Description :
작업지시서 workflow 상태값을 WORKFLOW_STATE와 DISPLAY_STAGE 상수 중심으로 정리하고, workflow 판단 함수와 일부 action nextState, 작업지시서 목록 상태 필터에서 직접 문자열 사용을 줄였다. DB 저장값과 API 응답 포맷은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/workorderStates.ts
- lib/workorder/workflow.ts
- lib/workorder/selectors.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/actions.ts
- lib/workorder/list/workOrderListControls.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/59_wafl-a-type-workorder-status-usage-cleanup.md

삭제 파일 목록 :
없음
