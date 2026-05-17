Version :
0.13.54

Summary :
고객사 초대 링크를 Google 로그인 게이트로 전환

Description :
고객사 초대 링크 화면에서 가입 신청 폼을 제거하고 멤버 초대와 동일한 Google 로그인 게이트 흐름으로 전환했다. Google OAuth requestType에 company를 추가하고, 고객사 관리자 초대 로그인 후 임시 고객사와 고객사 관리자 세션을 생성해 /admin 회사정보 입력 모달로 이어지도록 보강했다. 회사정보 저장 시 승인 대기 가입 신청 정보에도 회사명, 사업자명, 관리자 이름과 연락처가 반영되도록 수정했다.

수정 파일 목록 :
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- lib/auth/googleOAuth.ts
- app/api/auth/google/start/route.ts
- app/api/auth/google/callback/route.ts
- lib/admin/settings/companyOnboardingRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/auth/companyInvitationLoginRepository.ts

삭제 파일 목록 :
없음
