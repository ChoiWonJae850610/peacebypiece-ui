Version :
0.10.59

Summary :
멤버 승인과 권한 부여 화면 추가

Description :
고객관리자 멤버관리 화면에 가입 신청자를 승인하거나 거절하기 전 확인할 수 있는 승인 처리 영역과 권한 체크리스트를 추가했다. role template은 기본값으로만 사용하고 실제 저장은 permission_code 직접 부여 기준이라는 정책을 문서화했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/member-approval-permission-screen-0.10.59.md

삭제 파일 목록 :
없음
