Version :
0.13.79

Summary :
고객사 승인 멤버 등록 SQL 파라미터 타입 오류 수정

Description :
고객사 승인 처리 중 insert_company_member 단계에서 PostgreSQL이 파라미터 타입을 추론하지 못해 승인이 실패하던 문제를 수정했다. 회사 멤버 조회, 기존 멤버 승인 전환, 신규 멤버 등록 SQL을 typed CTE 구조로 정리해 모든 입력 파라미터의 text 타입을 명시했다.

수정 파일 목록 :
- lib/invitations/joinRequestRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
