# WAFL Add Button Family 0.21.14

0.21.14는 `+` 추가 계열을 하나의 Add 문법으로 정리하는 단계다.

## 기준

- 작은 아이콘 추가: `WaflAddActionButton`
- 카드형 빈 슬롯 추가: `WaflAddCardButton`
- 카드 내부 glyph: `WaflAddIconBubble`

## 변경

- `WaflAddCardButton`은 `label`, `description`, `icon` props를 받을 수 있다.
- children을 직접 넘기지 않으면 `WaflAddIconBubble` + label + description 구조를 자동으로 만든다.
- `WaflAddIconBubble`은 `sm / md / lg` size prop을 지원한다.
- 첨부 패널 메뉴의 popover/menu item radius를 `wafl-shape-*` 기준으로 정리했다.

## 원칙

- 화면 내부에서 직접 `+` glyph를 만들지 않는다.
- 카드형 추가 슬롯은 `WaflAddCardButton`을 우선 사용한다.
- 메뉴를 열어야 하는 작은 `+` 버튼은 `WaflAddActionButton` 또는 도메인 wrapper를 사용한다.
- 원형 plus button은 사용하지 않는다.
