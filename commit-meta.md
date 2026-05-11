Version :
0.10.56

Summary :
멤버 초대 링크 QR 화면과 관리자 메인 기준정보 모음 제거

Description :
고객관리자 메인 운영 대시보드 하단의 기준정보 모음 섹션을 제거하고, 멤버관리 화면에 내부 멤버 초대 링크와 QR 생성 화면의 1차 UI를 추가했다. 실제 초대 token 생성과 저장, QR 실제 렌더링, 링크 복사는 후속 API 연결 단계로 분리했다.

수정 파일 목록 :
- components/admin/dashboard/AdminConsoleSections.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/member-invitation-link-qr-screen-0.10.56.md

삭제 파일 목록 :
없음
