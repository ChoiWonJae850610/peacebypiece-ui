Version :
0.13.73

Summary :
고객사 초대 링크 로그인 후 재진입 흐름 보정

Description :
고객사 관리자 초대 링크를 Google 로그인 성공 시점에 사용 완료 처리하지 않고 진행 중 상태로만 표시하도록 수정했다. 회사 정보를 입력하지 않고 로그아웃해도 같은 계정이 다시 온보딩에 진입할 수 있게 기존 고객사 관리자 계정을 재사용하고, 온보딩 저장 시 진행 중인 초대 링크를 가입 신청과 연결하도록 보정했다. 시스템관리자 초대 링크 목록에는 진행 중 상태와 관련 오류 문구를 표시하도록 정리했다.

수정 파일 목록 :
- lib/auth/companyInvitationLoginRepository.ts
- lib/admin/settings/companyOnboardingRepository.ts
- components/system/companies/SystemCompanyApprovalConsole.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
