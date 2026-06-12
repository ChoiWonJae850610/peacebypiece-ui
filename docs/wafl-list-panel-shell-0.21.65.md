# WAFL List Panel Shell 0.21.65

## 목적
작업지시서 목록과 발주서 목록의 `controls → 생성 버튼 → divider → 목록 카드` 흐름을 같은 WAFL List Panel Shell 기준으로 맞춘다.

## 적용 기준
- 발주서 생성 버튼 문구는 `발주서 생성`으로 단순화한다.
- 생성 버튼 아래 divider 간격은 작업지시서 목록과 같은 `mt-3` 기준으로 맞춘다.
- divider 아래 첫 카드 시작 위치는 별도 `mt-*`가 아니라 목록 scroll 영역의 `py-3` 기준으로 맞춘다.
- 발주서 목록도 작업지시서 목록처럼 목록 영역에서 `overscroll-contain`과 `scrollbar-gutter: stable`을 사용한다.

## 주의
WaflButton, WaflSelectableCard를 사용하더라도 부모 wrapper의 margin/padding/scroll 영역이 다르면 화면 간격은 달라진다. 0.21.65는 컴포넌트 자체가 아니라 목록 패널 shell의 spacing 차이를 보정한다.
