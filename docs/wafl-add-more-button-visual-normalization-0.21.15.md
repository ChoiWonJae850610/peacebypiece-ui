# WAFL Add/More button visual normalization 0.21.15

## 목적
작업지시서 화면에서 `...` 버튼과 `+` 버튼이 같은 WAFL 계열로 보이도록 시각 기준을 보정한다.

## 변경 기준
- 작업지시서 목록 카드의 `...` 버튼은 `pbp-touch-target`에 의해 44px 이상으로 커지지 않게 한다.
- `WaflMoreActionButton` 자체의 md size 기준을 따른다.
- `WaflAddIconBubble`은 항상 border/background를 가지도록 정리한다.
- 카드형 추가 슬롯 안의 `+` glyph도 테두리가 있는 작은 둥근 네모로 보이게 한다.

## 제외
- 실제 원형 의미가 있는 dot/spinner는 유지한다.
- 작업지시서 기능 로직은 변경하지 않는다.
