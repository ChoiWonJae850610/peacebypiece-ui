Version :
0.9.224348

Summary :
검수 완료 저장 범위 경량화와 payload 사용처 점검

Description :
검수 완료와 재고 반영 시 전체 작업지시서 목록을 저장하지 않고 현재 작업지시서와 같은 리오더 그룹만 저장하도록 보정했다. 서버 PATCH 처리에서도 이전 상태 조회 범위를 요청된 작업지시서로 축소하고, spec_sheets.payload 컬럼은 legacy/detail snapshot 용도로 남기되 상태 변경 대량 저장 기준으로 쓰지 않도록 문서화했다.

수정 파일 목록 :
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-state-save-lightweight-and-payload-audit-0.9.224348.md

삭제 파일 목록 :
없음
