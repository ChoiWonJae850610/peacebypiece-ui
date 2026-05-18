Version :
0.13.78

Summary :
고객사 승인 DB 파라미터 오류 단계 추적과 회사명 중복 검사 쿼리 보정

Description :
고객사 승인 처리 중 PostgreSQL 파라미터 타입 오류가 계속 발생하는 문제를 추적할 수 있도록 승인 트랜잭션 단계를 구분하고 오류 응답에 실패 단계를 포함하도록 보강했다. 회사명 중복 검사 쿼리는 nullable 파라미터를 사용하지 않는 분기형 쿼리로 변경해 DB 타입 추론 오류 가능성을 줄였다. 승인 실패 메시지에는 개발 환경에서 단계와 상세 원인을 함께 표시하도록 수정했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
