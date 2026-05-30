Version : 0.18.41
Summary : 협력업체관리 목록 반응형 row 구조 재정리
Description : 협력업체관리 목록을 저장소관리 휴지통과 같은 컨테이너 폭 기준 wide table / compact list 구조로 재정리했습니다. PC와 넓은 태블릿 가로에서는 table row, 좁은 태블릿과 모바일에서는 compact card row를 사용하도록 렌더링을 분리했습니다. 검색/필터/정렬/수정 모달 흐름과 WorkspaceShell 스크롤 구조는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/partnerMaster/PartnerMasterList.tsx
- components/admin/partnerMaster/PartnerMasterResponsiveRows.tsx
추가 파일 목록 :
- components/admin/partnerMaster/partnerMasterResponsivePresentation.ts
- components/admin/partnerMaster/PartnerMasterSharedCells.tsx
- components/admin/partnerMaster/PartnerMasterWideTableRows.tsx
- components/admin/partnerMaster/PartnerMasterCompactListRows.tsx
- docs/partner-responsive-list-source-cleanup-0.18.41.md
삭제 파일 목록 :
- 없음
