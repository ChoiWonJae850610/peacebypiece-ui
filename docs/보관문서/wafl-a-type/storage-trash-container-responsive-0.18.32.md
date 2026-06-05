# 0.18.32 저장소관리 휴지통 컨테이너 기준 반응형 전환

## 목표
- 저장소관리 휴지통 목록을 브라우저 전체 폭이나 장비명 기준이 아니라 실제 목록 컨테이너 폭 기준으로 wide table / narrow compact list로 분리한다.
- PC와 갤럭시탭 가로처럼 목록 폭이 충분한 화면은 table row를 사용한다.
- 아이패드 미니, 갤럭시탭 세로, 모바일처럼 목록 폭이 좁은 화면은 compact list-card를 사용한다.

## 반영
- `useElementSize` 훅을 추가해 ResizeObserver로 실제 컨테이너 폭을 측정한다.
- `FileTrashResponsiveRows`를 추가해 wide table row와 narrow compact row를 렌더링 구조부터 분리한다.
- 기존 CSS breakpoint 기반 row 전환 대신 휴지통 목록 컨테이너 폭이 1080px 이상이면 table, 미만이면 compact list를 사용한다.
- `WorkspaceShell` 스크롤 구조는 변경하지 않았다.

## 후속 기준
- 저장소 휴지통에서 안정되면 협력업체 목록, 멤버 목록으로 같은 패턴을 확장한다.
- 화면 전체 레이아웃은 분리하되 row/action/data formatter는 공통화한다.
