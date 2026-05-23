Version : 0.15.82
Summary : 작업지시서 workflow serviceCode production gate 정리
Description : 작업지시서 workflow action 실행 전 검증과 serviceCode 계산을 공통 gate 유틸로 분리하고, workflow 검증 전 생산구성 snapshot 정규화를 적용해 검토요청/발주요청 검증 기준을 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
추가 파일 목록 :
- lib/workorder/workflowActionGate.ts
- docs/wafl-a-type/94_wafl-a-type-workflow-servicecode-production-gate-audit.md
삭제 파일 목록 :
