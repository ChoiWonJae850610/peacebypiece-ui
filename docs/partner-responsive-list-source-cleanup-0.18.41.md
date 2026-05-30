# 0.18.41 협력업체관리 목록 반응형 row 재정리

## 목적

0.18.40에서 적용한 협력업체관리 목록 반응형 전환이 PC 넓은 화면에서 안정적인 table row처럼 보이지 않는 문제를 보정한다.

## 반영 기준

- 저장소관리 휴지통에서 검증한 container width 기준 분기 방식을 협력업체관리 목록에도 적용한다.
- WorkspaceShell 스크롤 구조는 변경하지 않는다.
- 협력업체 검색/필터/정렬/row 클릭/수정 모달 흐름은 유지한다.

## 구조

- `PartnerMasterList`는 정렬 상태와 정렬된 데이터 계산만 담당한다.
- `PartnerMasterResponsiveRows`는 실제 목록 컨테이너 폭을 측정하고 wide/compact 렌더링을 선택한다.
- `PartnerMasterWideTableRows`는 PC와 넓은 태블릿 가로의 table row 렌더링을 담당한다.
- `PartnerMasterCompactListRows`는 좁은 태블릿/모바일의 compact card 렌더링을 담당한다.
- `PartnerMasterSharedCells`는 이름, 유형 badge, 상태 badge, value 표시 등 공통 cell을 담당한다.
- `partnerMasterResponsivePresentation`은 table/grid 기준과 row tone 계산을 담당한다.

## 변경하지 않은 것

- DB/API 저장 흐름
- 협력업체 등록/수정 모달 흐름
- WorkspaceShell 스크롤 구조
- 저장소관리 반응형 구조
