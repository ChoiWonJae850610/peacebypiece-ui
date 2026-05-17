Version :
0.13.44

Summary :
업무홈 기준정보 카드 화면 연결

Description :
업무홈 기준정보 카드를 실제 기준정보 화면으로 연결했다. 기준정보 업무 화면은 멤버 권한에 따라 조회 전용 또는 관리 가능 상태로 동작하며, 기준정보 전용 외주 공정 API를 추가해 협력업체 목록 권한 없이 공정 기준정보를 조회하고 저장할 수 있도록 정리했다.

수정 파일 목록 :
- components/admin/standards/AdminStandardsSection.tsx
- lib/admin/settings/standardsApiClient.ts
- lib/admin/settings/standardsTypes.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts
- lib/navigation/memberWorkspaceCards.ts

추가 파일 목록 :
- app/api/admin/standards/processes/route.ts
- app/workspace/standards/page.tsx

삭제 파일 목록 :
없음
