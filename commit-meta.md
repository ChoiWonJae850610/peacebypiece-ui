Version : 0.16.12
Summary : API 권한 보호 정리 1차
Description : workspace API 공통 guard를 추가하고 작업지시서 API route handler의 세션, 회사 범위, 회사 접근 제한, 멤버 권한 확인 흐름을 공통 guard 기반으로 정리했습니다. 기존 작업지시서 API 동작과 DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
추가 파일 목록 :
- lib/auth/apiRouteGuards.ts
삭제 파일 목록 :
- 없음
