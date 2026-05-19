Version :
0.13.98

Summary :
멤버 초대 링크 UI 단순화와 권한 4개 항목 정리

Description :
고객사 관리자 멤버 초대 화면을 시스템관리자 고객사 초대 화면과 같은 초대 만료 및 링크 생성 중심 구조로 단순화했다. 멤버 권한 모달은 작업지시서 관리, 협력업체 관리, 기준정보 관리, 발주 권한 4개 항목으로 정리하고, 통계와 기본 조회 권한은 항상 유지되도록 보정했다. full reset 역할 기본 권한도 새 권한 기준에 맞췄다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/permissions/memberPermissionMatrix.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
