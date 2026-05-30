Version : 0.18.48
Summary : 협력업체관리 필터 toolbar 실제 폭 확장 보정
Description : 협력업체관리 필터 toolbar 내부 grid가 AdminFilterBar 전체 폭을 차지하지 못해 검색/유형/상태 필터가 계속 왼쪽에 몰려 보이는 문제를 보정했습니다. 검색 영역은 남는 폭을 차지하고 유형/상태 select 그룹은 넓은 화면에서 우측 고정 폭으로 배치되도록 조정했습니다. 기존 목록 반응형과 검색/필터/정렬/등록/수정 흐름은 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/partnerMaster/PartnerMasterFilters.tsx
추가 파일 목록 :
- docs/partner-filter-toolbar-width-0.18.48.md
삭제 파일 목록 :
- 없음
