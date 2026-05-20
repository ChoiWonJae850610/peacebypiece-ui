Version :
0.15.24

Summary :
초대 승인 대기 public 화면 visual pass 적용

Description :
초대 링크, 초대 오류, 가입 신청 승인 대기 화면의 public 계열 UI를 A-TYPE semantic token 중심으로 보정했다. pending 화면의 로그아웃 placeholder는 실제 로그아웃 POST 버튼으로 연결했고, 초대 화면에는 초대 유형과 만료일 요약 surface를 추가했다.

수정 파일 목록 :
- components/invitations/CompanyInvitationJoinRequestPage.tsx
- components/invitations/MemberInvitationJoinRequestPage.tsx
- components/invitations/PendingApprovalDashboard.tsx
- lib/invitations/pendingApprovalDashboardPresentation.ts
- app/(public)/invite/error/page.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/47_wafl-a-type-public-flow-visual-pass.md

삭제 파일 목록 :
없음
