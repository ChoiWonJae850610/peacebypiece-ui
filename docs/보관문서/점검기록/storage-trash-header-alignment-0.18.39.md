# 0.18.39 저장소관리 휴지통 header 정렬 보정

## 목적

휴지통 제목과 액션 버튼 묶음이 모바일/태블릿/PC에서 서로 다른 높이에 배치되는 문제를 보정한다.

## 변경

- FileTrashSection의 AdminActionBar를 휴지통 영역에서만 단일 row 기준으로 고정했다.
- 액션 버튼 묶음의 self-end 의존을 제거했다.
- 제목과 버튼 묶음은 `items-center` 기준으로 같은 높이에 정렬된다.
- 버튼은 icon-only compact 형태를 유지한다.

## 제외

- WorkspaceShell 스크롤 구조 변경 없음
- 휴지통 복원/삭제/비우기 기능 변경 없음
- DB/API/R2 흐름 변경 없음
