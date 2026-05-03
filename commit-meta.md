Version :
0.9.139

Summary :
30일 고정 휴지통 정책 반영과 고객관리자 저장정책 정리

Description :
고객사별 삭제 방식과 보관기간 설정을 제거하고 전 고객 공통 30일 휴지통 보관 정책으로 고정했다. 고객관리자 저장정책 모달에서는 보관기간 선택 UI를 제거하고 30일 복원 가능 안내를 표시하도록 변경했다. 기존 DB 값과 무관하게 런타임 파일 정책은 휴지통 이동과 30일 보관으로 정규화하며, 첨부 삭제 API는 R2 직접 삭제 없이 soft delete만 수행하도록 정리했다. 시스템관리자 R2 purge 후보와 실행 기능은 별도 버전으로 분리했다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- app/api/workorders/attachments/delete/route.ts
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- docs/restore-baseline-0.9.121.md
- lib/admin/adminDashboard.presentation.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/settings/companyDefaults.ts
- lib/admin/settings/companyRepository.ts
- lib/admin/settings/presentation.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/file-retention-purge-policy-0.9.139.md

삭제 파일 목록 :
없음
