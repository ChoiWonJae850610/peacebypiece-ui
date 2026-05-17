Version :
0.13.35

Summary :
fallback mock 고정 회사 참조 제거와 빌드 오류 수정

Description :
0.13.34 빌드에서 남아 있던 getCurrentAdminCompany import 오류를 수정했다. 관리자 홈, 업체관리, 히스토리, 작업공간, 첨부 업로드/삭제, 첨부/메모 DB 저장 흐름에서 고정 회사 상수 참조를 제거하고 세션 companyId 또는 작업지시서의 실제 company_id 기준으로 동작하도록 정리했다. 작업지시서와 첨부/메모 repository의 mock fallback 진입도 DB 기준 empty state 흐름으로 정리했다.

수정 파일 목록 :
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/workorder/persistence/attachmentMemoAdapter.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- lib/repositories/dbWorkorderRepository.ts
- lib/repositories/workorderRepositoryFactory.ts
- lib/repositories/workorderRepositoryMode.ts
- lib/constants/app.ts
- lib/admin/adminFiles.purgeWorker.ts
- lib/admin/adminOperations.repository.ts
- lib/admin/settings/companyScope.ts
- lib/admin/history/repository.ts
- components/workspace/MemberWorkspaceHome.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/invitations/PendingApprovalDashboard.tsx
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx
- app/workspace/page.tsx
- app/worker/page.tsx
- app/api/workorders/attachments/upload/complete/route.ts
- app/api/workorders/attachments/delete/route.ts
- app/admin/page.tsx
- app/admin/partners/page.tsx
- app/admin/history/page.tsx
- app/admin/files/page.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
- lib/constants/company.ts
