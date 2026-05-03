Version :
0.9.145

Summary :
관리자 설정 모달의 사용 여부 토글 UI 통일

Description :
관리자 환경설정 페이지의 파일 정책, 알림 정책, 생산품 유형, 단위 표준 모달에서 사용/미사용 표시가 배지와 토글로 섞여 있던 부분을 공통 AdminUsageToggle 기준으로 정리했다. 기존 저장 API, DB schema, R2/첨부/메모 기능은 변경하지 않았다.

수정 파일 목록 :
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx
- components/admin/standards/AdminItemCategoryManagementModal.tsx
- components/admin/standards/AdminUnitManagementModal.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- components/admin/common/AdminUsageToggle.tsx
- docs/common-ui-layout-refactor-0.9.145.md

삭제 파일 목록 :
없음
