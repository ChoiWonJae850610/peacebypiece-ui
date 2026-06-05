# 0.18.26 갤럭시탭 가로 스크롤 안정화

## 목표
- iPad에서는 동작하지만 Galaxy Tab 가로 화면에서 관리자 화면 스크롤/터치가 불안정한 문제를 줄인다.
- 저장소관리, 협력업체관리, 멤버관리의 태블릿 구간을 페이지 전체 스크롤 중심으로 강제한다.

## 적용 방향
- WorkspaceShell의 태블릿 구간에서 중첩 scroll container 의존을 줄였다.
- AdminTable은 xl 미만에서 inline grid-template-columns를 쓰지 않고 1열 카드형 흐름으로 렌더링한다.
- xl 이상 PC에서만 표 header/grid column 구조와 내부 스크롤을 유지한다.
- Galaxy Tab Android Chrome/Samsung Internet에서 부모 overflow-hidden과 자식 overflow-auto가 충돌하지 않도록 touch-pan-y/overscroll-auto/overflow-visible 기준을 보강했다.

## 변경하지 않은 것
- 통계정보 화면은 변경하지 않았다.
- DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았다.
