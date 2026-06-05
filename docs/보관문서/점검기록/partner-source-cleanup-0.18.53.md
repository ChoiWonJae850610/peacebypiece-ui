# 0.18.53 협력업체관리 소스 정리 1차

## 목적

협력업체관리 목록의 responsive table/list 구조는 유지하면서, 0.18.40~0.18.52 동안 분산·중복된 타입, empty state, sort button 책임을 분리했다.

## 변경 범위

- `PartnerMasterResponsiveRows`는 컨테이너 폭 측정과 wide/compact 분기만 담당한다.
- `PartnerMasterWideTableRows`와 `PartnerMasterCompactListRows`에 중복되던 list text 타입을 `partnerMasterListTypes.ts`로 분리했다.
- wide/compact 양쪽에서 쓰는 empty state를 `PartnerMasterRowsEmpty`로 분리했다.
- wide table header sort button과 compact sort chip을 `PartnerMasterSortButton`으로 분리했다.
- 기존 1080px 기준 wide table / compact card 전환은 유지했다.

## 변경하지 않은 것

- 검색 / 유형 필터 / 상태 필터 동작
- 정렬 상태 및 정렬 결과
- row click / 수정 모달 진입
- 등록/수정 저장 흐름
- WorkspaceShell 스크롤 구조
- DB/API/협력업체 저장 흐름

## 다음 작업 후보

- 협력업체관리 상단/목록 최종 눈검수
- 멤버관리 목록에 container width 기준 responsive table/list 패턴 적용
