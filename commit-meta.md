Version : 0.9.116
Base Version : 0.9.115
Target Version : 0.9.116
Summary : 관리자 거래처 read-only 필터 i18n 의존성 제거
Description : 0.9.113에서 AdminPartnersReadOnlyPage의 직접 useI18n 호출은 제거했지만, 해당 화면이 여전히 useI18n을 내부 호출하는 PartnerMasterFilters를 렌더링하고 있어 /admin/partners build/prerender 단계에서 같은 계열의 오류가 재발할 수 있었습니다. AdminPartnersReadOnlyPage에서 PartnerMasterFilters 의존성을 제거하고 파일 내부의 AdminPartnersReadOnlyFilters로 검색, 유형 필터, 상태 필터, 필터 카운트를 처리하도록 변경했습니다. partner 저장/수정/action, repository/API, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx
추가 파일 목록 :
- docs/admin/admin_partners_readonly_filter_i18n_fix.md
삭제 파일 목록 :
- 없음
