Version : 0.10.19
Summary : 협력업체 관리 내부 스크롤 구조 재보정
Description : 고객관리자 협력업체 관리 화면에서 페이지 전체가 스크롤되어 요약 카드와 검색/필터 카드가 사라지던 문제를 보정했습니다. AdminShell에 PC 기준 고정형 콘텐츠 모드를 추가하고, /admin/partners에서만 목록 테이블 내부 스크롤 구조를 사용하도록 조정했습니다. 협력업체 저장/수정/필터 로직과 DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/layout/AdminShell.tsx
- app/admin/partners/page.tsx
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterHeader.tsx
- components/admin/partnerMaster/PartnerMasterSummaryCards.tsx
- components/admin/partnerMaster/PartnerMasterFilters.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx

추가 파일 목록 :
- docs/admin-partners-internal-scroll-0.10.19.md

삭제 파일 목록 :
- 없음
