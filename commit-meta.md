Version : 0.15.73.6
Summary : 작업지시서 생성 직후 상세 로딩 상태 보정
Description : 작업지시서 생성 API 응답과 클라이언트 생성 저장 결과를 상세 스냅샷 보유 상태로 명시해 생성 직후 선택된 작업지시서가 계속 상세 로딩 상태에 머무르지 않도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
추가 파일 목록 :
삭제 파일 목록 :
