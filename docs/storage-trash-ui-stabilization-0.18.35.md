# 0.18.35 저장소관리 휴지통 UI 안정화

## 목적

0.18.34 적용 후 확인된 저장소관리 휴지통 영역의 표시 문제를 보정한다.

- 유형 badge의 도메인별 색상 구분을 강화한다.
- badge 색상은 직접 색상값이 아니라 기존 theme semantic token과 CSS variable 기반 `color-mix`를 사용한다.
- 휴지통 상단 액션 버튼을 icon-only compact 형태로 줄인다.
- PC 100% 화면에서 휴지통 목록 하단이 가려지는 문제를 줄이기 위해 저장소관리 내부의 2xl 고정 높이/overflow 의존을 완화한다.

## 반영 내용

- `AppBadge`의 `workorder`, `design`, `document`, `memo`, `file` tone을 서로 더 구분되도록 조정했다.
- `FileTrashSection` 액션 버튼을 우측 정렬 icon-only 형태로 정리했다.
- 복원/삭제 버튼은 선택 개수가 있을 때 작은 count 표시를 유지한다.
- `AdminFilesWorkspaceClient`의 저장소관리 내부 컨테이너에서 2xl 이상 고정 높이/overflow-hidden 의존을 제거했다.
- `WorkspaceShell`은 변경하지 않았다.

## 비변경 범위

- DB/API/R2 흐름 변경 없음
- 휴지통 복원/삭제/비우기 로직 변경 없음
- WorkspaceShell 스크롤 구조 변경 없음
