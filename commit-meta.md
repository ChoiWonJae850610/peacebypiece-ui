Version :
0.13.40

Summary :
업무홈 카드 권한 구조와 협력업체 기준정보 CRUD 권한 정리

Description :
업무홈 카드 노출을 멤버 권한 기준으로 조립하도록 정리하고, 협력업체와 기준정보 카드를 추가했다. 멤버 권한 카탈로그에는 작업흐름 그룹과 협력업체/기준정보 CRUD 권한을 추가했으며, 기존 통합 권한은 저장 호환을 유지하되 상세 모달 표시에서는 제외했다. 권한 저장 시 신규 권한 코드가 현재 DB permission_catalog에 없더라도 카탈로그 항목을 보강한 뒤 저장하도록 처리했다. full_reset.sql의 권한 카탈로그와 역할 기본값도 함께 맞췄다.

수정 파일 목록 :
- app/api/admin/partners/route.ts
- app/api/admin/standards/route.ts
- app/workspace/page.tsx
- components/workspace/MemberWorkspaceHome.tsx
- db/schema/full_reset.sql
- lib/admin/members/memberManagementPresentation.ts
- lib/admin/members/memberRepository.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/admin.ts
- lib/i18n/ko/common.ts
- lib/navigation/memberWorkspaceCards.ts
- lib/permissions/memberPermissionMatrix.ts
- lib/permissions/permissionPolicy.ts

추가 파일 목록 :
- lib/admin/members/memberWorkspaceAccess.ts

삭제 파일 목록 :
없음
