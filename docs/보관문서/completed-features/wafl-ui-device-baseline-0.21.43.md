# WAFL UI device baseline 0.21.43

## 목적

0.21.43은 발주서 화면 확정 전에 PC, 태블릿, 모바일에서 WAFL UI 1차 기준을 고정하는 버전이다. 새 기능 구현보다 shape, density, 예외 기준을 문서화하고 `/ui` 점검판에 반영한다.

## 고정 기준

| 구분 | 기준 |
| --- | --- |
| PC | 3패널, 모달, table shell은 `surface`를 쓰고 내부 row, add, empty, info는 `control`을 쓴다. |
| Tablet | PC와 같은 shape family를 유지하되 density만 `compact/default`로 낮춘다. |
| Mobile | row가 카드처럼 보여도 `control` shape를 유지하고 높이와 padding만 낮춘다. |
| 상태 | selected/current/danger/disabled는 shape 변경 없이 tone, border, background로만 구분한다. |

## 0.21.38~0.21.41에서 묶은 계열

- Add / Empty / Upload dashed box
- 모달 내부 InfoBox / summary / row
- 작업지시서 모바일·태블릿 detail density
- 멤버관리 compact row와 권한 모달
- 저장소 휴지통 compact row와 상세 모달
- 회사 파일 preview와 개인설정 모달

## 예외 기준

아래 요소는 실제 의미가 있어 직접 원형 또는 특수 shape를 유지할 수 있다.

- dot
- spinner
- avatar
- progress bar / progress node
- chart primitive
- color swatch
- calendar range
- layout-only class

## 다음 단계

0.21.44부터는 이 기준을 유지하면서 발주서 화면 실제 사용 UI를 확정한다. 발주서 화면에서 새 direct style을 추가하지 않고, 이미 고정한 `WaflSurface`, `WaflInfoBox`, `WaflAddCard`, `WaflEmptyCard`, `WaflButton`, `WaflInput`, `AppSelect`, `AppBadge` 기준으로만 조합한다.
