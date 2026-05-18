Version :
0.13.71

Summary :
고객사 관리 목록 폭 정리와 빌드 타입 오류 수정

Description :
시스템관리자 고객사 관리 목록의 과도한 컬럼 폭과 긴 문자열 노출을 줄여 좌우 스크롤 없이 요약 정보를 확인할 수 있게 정리했다. 고객사 온보딩 입력 필드에는 최대 입력 길이를 추가했다. 가입 신청 목록 조회 중 trial 종료일 값이 undefined일 수 있어 발생하던 TypeScript 빌드 오류를 수정했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/invitations/joinRequestRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
