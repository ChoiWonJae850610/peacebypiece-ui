# 0.18.54 멤버관리 목록 반응형 전환

## 목표

멤버관리의 멤버 목록을 저장소관리/협력업체관리와 같은 컨테이너 폭 기준 wide table / compact card 구조로 전환한다.

## 적용 범위

- `AdminMemberDirectorySection`에서 기존 `AdminTable` 렌더링을 멤버 전용 responsive rows로 교체
- `AdminMemberDirectoryResponsiveRows` 추가
- 컨테이너 폭 1080px 이상: wide table
- 컨테이너 폭 1080px 미만: compact card

## 유지한 것

- 검색/상태/역할 필터 흐름
- 승인/거절 action 렌더링
- row 클릭 상세 모달 진입
- WorkspaceShell 스크롤 구조
- DB/API/멤버 승인/수정 흐름
