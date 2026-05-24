Version : 0.16.10
Summary : 작업지시서 service/repository 흐름 정리
Description : 작업지시서 API route handler가 DB repository를 직접 호출하던 흐름을 service와 repository facade 계층으로 분리했습니다. 첨부/메모 snapshot hydration과 memo thread replace 처리는 service 계층으로 이동했고, API route는 요청 검증, 권한 확인, 감사 로그, 응답 조립 중심으로 축소했습니다. DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
추가 파일 목록 :
- lib/workorder/repository/workOrderRepository.ts
- lib/workorder/service/workOrderService.ts
삭제 파일 목록 :
- 없음
