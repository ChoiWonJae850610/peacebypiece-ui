Version :
0.11.7

Summary :
시스템관리자 고객사 초대와 승인 화면 공통 UI 적용

Description :
시스템관리자 고객사 초대와 고객사 승인 화면의 개별 버튼, 링크, 상태 라벨, empty state 구현을 AdminButton, AdminLinkButton, AdminStatusBadge, AdminEmptyState 공통 컴포넌트 기준으로 전환했다. 초대 생성, 고객사 승인/거절 API와 DB 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-company-invite-ui-standardization-0.11.7.md

삭제 파일 목록 :
없음
