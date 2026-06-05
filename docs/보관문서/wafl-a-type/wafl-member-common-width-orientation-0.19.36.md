# WAFL 공통 폭/회전 기준 보정 0.19.36

## 목적

멤버관리 화면이 통계정보, 협력업체관리, 저장소관리와 같은 WAFL 공통 폭 규칙을 타도록 정리하고, 갤럭시탭 등 Android 태블릿에서 가로/세로 회전 후 responsive 폭 판정이 늦게 갱신되는 문제를 보정한다.

## 반영 기준

- 화면별 wrapper로 폭을 수동 조정하지 않는다.
- `WaflPageHero`, `WaflSectionPanel`, `WaflDataTable`이 공통 폭과 `min-width` 기준을 가진다.
- 멤버관리 본문 섹션은 `AdminPanelSection` compatibility wrapper 대신 `WaflSectionPanel`을 직접 사용한다.
- 태블릿 회전 후에는 `ResizeObserver`뿐 아니라 `resize`, `orientationchange`, `visualViewport` 변화와 지연 재측정을 함께 사용한다.

## 확인 지점

- `/workspace/members` 상단 hero와 멤버 목록 카드의 우측 border가 다른 화면과 같은 폭으로 보이는지 확인한다.
- 갤럭시탭에서 세로 → 가로 → 세로 회전 후 멤버 목록이 stale width로 남지 않는지 확인한다.
- 통계정보, 협력업체관리, 저장소관리의 기존 폭과 간격은 유지되어야 한다.
