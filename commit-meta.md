Version :
0.13.48

Summary :
담당자 표시명과 프로필 완료 상태 기준 정리

Description :
업무 프로필에 저장된 이름을 현재 사용자 정보와 작업지시서 담당자 목록, 작업지시서 조회 화면의 담당자 표시명에 우선 반영하도록 정리했다. 고객사 관리자 계정은 담당자 후보 조회에서 제외하고, 작업지시서 생성 시에도 세션 쿠키 이름보다 저장된 업무 프로필 이름을 우선 사용하도록 보강했다.

수정 파일 목록 :
- lib/auth/currentUser.ts
- app/api/auth/me/route.ts
- lib/admin/settings/userAccessRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
