Version : 0.10.17
Summary : 고객관리자 협력업체 관리 화면 밀도 정리
Description : 고객관리자 협력업체 관리 화면에서 중복되는 업체 유형 분포 카드와 파란색 도움말 안내 카드를 제거했습니다. 본문 중복 제목/설명을 없애고 상단 요약 카드 5개와 업체추가 버튼, 검색/필터, 내부 스크롤 목록 중심으로 화면 밀도를 정리했습니다. 협력업체 저장/수정/필터 로직과 DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterHeader.tsx
- components/admin/partnerMaster/PartnerMasterSummaryCards.tsx
- components/admin/partnerMaster/PartnerMasterFilters.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx

추가 파일 목록 :
- docs/admin-partners-density-cleanup-0.10.17.md

삭제 파일 목록 :
- 없음
