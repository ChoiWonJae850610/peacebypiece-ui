Version :
0.11.47

Summary :
고객관리자 화면 i18n 하드코딩 정리 1차

Description :
환경설정, 정책 overview, 단위 표준 모달, 외주공정 표준 선택 모달에서 고객관리자에게 직접 보이는 잔여 하드코딩 문구를 useAdminTranslation 기반 key/fallback 구조로 이동했다.

수정 파일 목록 :
- components/admin/settings/AdminSettingsHub.tsx
- components/admin/settings/AdminPolicyOverview.tsx
- components/admin/standards/AdminUnitManagementModal.tsx
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/i18n-admin-customer-visible-cleanup-0.11.47.md

삭제 파일 목록 :
없음
