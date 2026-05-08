Version :
0.9.22407

Summary :
저장소 휴지통 i18n 문구와 하드코딩 정리 1차

Description :
시스템관리자 실제 삭제 후보 화면의 긴 사용자 노출 문구를 storagePurgePresentation 계층으로 분리하고, 연결 첨부파일·영구삭제·복구·작지 표현을 역할 기반 문구로 정리했다. delete_reason 제거 이후 active code/schema 범위의 deleteReason 참조도 확인했다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- lib/system/systemStats.ts
- lib/admin/settings/adminPolicyPresentation.ts
- lib/admin/dbCompletionAudit.ts
- lib/admin/dbIntegration.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/system/storagePurgePresentation.ts
- docs/storage-trash-i18n-hardcoding-cleanup-0.9.22407.md

삭제 파일 목록 :
없음
