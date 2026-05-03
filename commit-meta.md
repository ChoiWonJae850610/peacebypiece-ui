Version :
0.9.137

Summary :
관리자 설정 화면 저장 안정화

Description :
관리자 설정 화면에서 테마, 언어, 파일 정책, 알림 정책, 외주 공정 유형 저장 중 중복 클릭과 추가 변경을 제한했다. 고객사 파일 보관 정책은 향후 시스템관리자 R2 purge 후보 산정 기준으로 문서화했으며, 기존 설정 UI와 저장 흐름은 유지했다.

수정 파일 목록 :
- components/admin/settings/AdminCompanySettingsForm.tsx
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx
- components/admin/standards/AdminStandardsSection.tsx
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/admin-settings-stability-0.9.137.md

삭제 파일 목록 :
없음
