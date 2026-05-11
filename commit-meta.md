Version :
0.10.55

Summary :
권한 카탈로그와 관리자 홈 아이콘 보정

Description :
멤버관리 화면에 권한 카탈로그와 권한 매트릭스 기준을 추가하고, role은 기본 체크값이며 실제 접근 제어는 permission_code 직접 부여 기준이라는 정책을 문서화했다. 관리자 공통 상단 타이틀 카드의 홈 버튼은 텍스트 대신 집 모양 아이콘 버튼으로 변경했다.

수정 파일 목록 :
- components/admin/layout/AdminTopbar.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/permissions/index.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/permissions/memberPermissionMatrix.ts
- docs/member-permission-catalog-matrix-0.10.55.md

삭제 파일 목록 :
없음
