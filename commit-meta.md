Version :
0.13.93

Summary :
주소 검색과 초대 오류 문구 정리

Description :
도로명주소 API 실패 원인을 개발환경에서 확인할 수 있도록 응답을 세분화하고, 사용자 화면에는 승인키·외부 API 오류를 자연스러운 안내 문구로 표시하도록 정리했다. 초대 링크 오류 문구도 공통 presentation 함수로 분리해 내부 error code가 직접 노출되지 않도록 보정했다.

수정 파일 목록 :
- app/api/address/search/route.ts
- lib/address/jusoAddressSearch.ts
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- app/invite/error/page.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/invitations/invitationErrorPresentation.ts

삭제 파일 목록 :
없음
