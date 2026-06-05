# 0.18.37 저장소관리 휴지통 소스 정리

## 목적

0.18.32~0.18.36에서 안정화한 저장소관리 휴지통의 컨테이너 폭 기준 반응형 구조를 유지하면서, `FileTrashResponsiveRows`에 몰려 있던 렌더링 책임을 분리한다.

## 정리 범위

- `FileTrashResponsiveRows`는 컨테이너 폭 측정과 wide/compact 분기만 담당한다.
- wide table row는 `FileTrashWideTableRows`로 분리한다.
- narrow compact list row는 `FileTrashCompactListRows`로 분리한다.
- 선택 컨트롤, 대상 요약, row tone 계산은 `FileTrashSharedCells`로 분리한다.
- 유형 badge tone 매핑은 `fileTrashResponsivePresentation`과 `FileTrashTypeBadge`로 분리한다.

## 유지한 것

- 컨테이너 폭 기준 1080px 전환 기준 유지
- wide table / compact list 렌더링 구조 유지
- WorkspaceShell 스크롤 구조 변경 없음
- DB/API/R2/첨부/메모/휴지통 복원·삭제·비우기 흐름 변경 없음

## 다음 단계

저장소관리 휴지통 결과가 유지되면 `FileStorageSummary` 또는 협력업체관리 목록으로 동일한 반응형 패턴을 확장한다.
