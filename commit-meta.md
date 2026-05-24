Version : 0.16.14
Summary : trace/debug 흐름 추가
Description : 개발 모드에서 작업지시서 버튼, API, service, repository 흐름을 추적할 수 있는 공통 trace 유틸을 추가하고 주요 작업지시서 액션과 API/service/query 흐름에 trace를 연결했습니다. production에서는 출력되지 않도록 제한했으며 개인정보, secret, token, 실제 URL 노출 방지용 redaction 기준을 포함했습니다. DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- features/workorders/controllers/useWorkOrderWorkspaceController.ts
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/workOrderRepository.ts
- lib/workorder/service/workOrderService.ts
추가 파일 목록 :
- lib/debug/trace.ts
삭제 파일 목록 :
- 없음
