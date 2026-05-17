Version :
0.13.41

Summary :
업무홈 협력업체 카드 화면 연결

Description :
업무홈의 협력업체 카드를 실제 협력업체 관리 화면으로 연결했다. 멤버 권한에 따라 협력업체 등록과 수정 기능을 제한하고, 협력업체 API 권한 검사를 실제 세션 멤버 권한 기준으로 보강했다.

수정 파일 목록 :
- app/api/admin/partners/route.ts
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterFormModal.tsx
- components/admin/partnerMaster/PartnerMasterHeader.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx
- components/admin/partnerMaster/usePartnerMasterController.ts
- lib/constants/app.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts
- lib/navigation/memberWorkspaceCards.ts
- lib/partners/sessionScope.ts

추가 파일 목록 :
- app/workspace/partners/page.tsx
- components/workspace/MemberWorkspaceShell.tsx

삭제 파일 목록 :
없음
