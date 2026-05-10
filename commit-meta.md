Version :
0.9.224351

Summary :
작업지시서 상태 patch 로그 타입 오류 수정

Description :
작업지시서 상태 변경 최소 patch API에서 DB 요청 로그 함수에 허용되지 않는 PATCH_STATE 값을 전달해 발생한 TypeScript 빌드 오류를 수정했다. APP_VERSION도 0.9.224351로 갱신했다.

수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
