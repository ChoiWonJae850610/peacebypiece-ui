Version : 0.9.100
Base Version : 0.9.99
Target Version : 0.9.100
Summary : 거래처 공장관리 read-only 복원
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin/partners를 read-only 거래처/공장관리 화면으로 복원했습니다. 기존 GET /api/admin/partners, buildPartnerListViewModel, PartnerMasterFilters를 사용해 업체 목록과 필터를 표시하며 생성/수정/외주공정 저장 action은 연결하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/partners/page.tsx
- lib/admin/adminRegressionRoutes.ts
추가 파일 목록 :
- components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx
- docs/admin/admin_partners_readonly_restore.md
삭제 파일 목록 :
- 없음
