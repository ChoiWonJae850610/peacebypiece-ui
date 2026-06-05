# 0.18.27 Tablet Fluid Admin Layout

## 목표

iPad와 Galaxy Tab을 별도 예외로 나누지 않고 같은 태블릿 레이아웃 기준으로 통일한다.

## 적용 원칙

- 태블릿 이하에서는 관리자 화면을 페이지 전체 스크롤 중심으로 처리한다.
- PC 전용 고정 패널, 내부 스크롤, 표 헤더/grid column 구조는 2xl 이상에서만 유지한다.
- 저장소관리, 협력업체관리, 멤버관리의 목록은 태블릿에서 카드/list 흐름으로 보이게 한다.
- Android 태블릿 가로에서 fixed viewport + nested overflow 조합이 터치 스크롤을 막는 문제를 피하기 위해 WorkspaceShell의 fixed root를 min-h-dvh 기반 page scroll 구조로 전환한다.

## 변경 범위

- WorkspaceShell
- AdminTable / AdminPanelSection
- 저장소관리
- 협력업체관리
- 멤버관리

DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않는다.
