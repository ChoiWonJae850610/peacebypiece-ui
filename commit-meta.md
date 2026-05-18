Version :
0.13.77

Summary :
고객사 승인 API DB 파라미터 타입 오류 수정

Description :
고객사 승인 처리 중 PostgreSQL이 파라미터 타입을 추론하지 못해 승인 API가 500으로 실패하던 문제를 수정했다. 승인 및 초대 처리 관련 SQL 파라미터에 명시적 타입 캐스팅을 보강하고, 동일 계열 DB 오류가 화면에 내부 원문 그대로 노출되지 않도록 오류 코드를 정리했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
