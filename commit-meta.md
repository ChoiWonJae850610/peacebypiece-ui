Version :
0.10.54

Summary :
멤버관리 1차 IA 화면 재정리

Description :
고객관리자 멤버관리 화면을 단순 placeholder에서 멤버 목록, 초대 대기, 가입 신청 승인 대기, 역할 기본값, 권한 카드, 권한 그룹을 확인할 수 있는 1차 IA 화면으로 재구성했다. 실제 DB/API 연결 전 empty 상태와 권한 기준 표시 데이터를 분리하고 앱 버전을 0.10.54로 올렸다.

수정 파일 목록 :
- app/admin/members/page.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- docs/member-management-ia-0.10.54.md

삭제 파일 목록 :
- components/admin/members/AdminMemberManagementPlaceholder.tsx
