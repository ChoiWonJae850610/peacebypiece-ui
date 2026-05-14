# runtimeMode 모바일 작업지시서 상단바 보정 — 0.11.85

## 목적

모바일 작업지시서 화면에서 development 모드일 때 DB 연결 배지와 사용자 변경 톱니가 작은 화면 폭 때문에 보이지 않는 문제를 보정한다.

## 변경 기준

`RUNTIME_VISIBILITY.showRepositoryBadges`와 `RUNTIME_VISIBILITY.showUserSwitchingTools` 기준은 그대로 유지한다.

- production: DB 연결 배지 숨김, 사용자 변경 도구 숨김
- development: DB 연결 배지 표시, 사용자 변경 도구 표시

## UI 보정

모바일 상단바의 기본 버튼 영역에서는 홈, 새로고침, 메뉴만 유지한다.

DB 연결 배지와 사용자 변경 톱니는 development toolbar 영역으로 분리했다.
이렇게 하면 좁은 모바일 폭에서도 버튼이 한 줄 밖으로 밀리지 않고, 개발용 도구가 별도 줄에서 확인된다.

## 영향 범위

- PC 사이드바: 변경 없음
- 태블릿 사이드바: 변경 없음
- 모바일 상단바: development toolbar 표시 방식만 변경
- runtimeMode 정책: 변경 없음
- DB/R2/첨부/메모/휴지통/purge 흐름: 변경 없음
