Version :
0.13.51

Summary :
고객사관리 화면에 고객사 관리자 초대 흐름 통합

Description :
시스템관리자 고객사관리 화면에서 고객사 승인 대기 목록과 고객사 관리자 초대 링크 생성을 한 화면에서 처리하도록 통합했다. 시스템관리자가 회사 정보를 직접 입력하는 흐름 대신 초대 대상 이메일과 만료일만 입력하고, 회사 정보는 고객사 관리자가 초대 링크 로그인 후 직접 입력하는 후속 흐름으로 분리했다. 기존 /system/invites 경로는 /system/companies로 이동하도록 정리하고, system_to_company_admin 초대 생성 시 개발용 시스템관리자 scope의 userId를 사용하도록 보강했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- app/system/invites/page.tsx
- lib/invitations/api/invitationRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
