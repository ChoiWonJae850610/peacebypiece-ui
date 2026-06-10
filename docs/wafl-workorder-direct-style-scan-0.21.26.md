# WAFL workorder direct style scan · 0.21.26

## 목적
작업지시서 화면을 WAFL 기준 화면으로 고정하기 전에 남은 직접 스타일을 제거 대상과 예외 대상으로 분리한다.

## 이번 버전에서 정리한 영역
- `MaterialSection`의 소재 카드, 타입 라벨, 0수량 안내/정리 버튼을 Foundation control 계열로 연결
- `OrderInfoSection`의 공정 카드와 검수 액션 버튼을 Foundation control 계열로 연결
- `OutsourcingSection`의 외곽 table panel, add action, handoff 안내를 Foundation control 계열로 연결
- `/ui` Foundation primitive 섹션에 direct style scan 기준을 추가

## 제거 대상
아래 조합은 화면 내부에서 직접 만들지 않고 WAFL primitive 또는 공통 컴포넌트로 전환한다.

- `rounded-xl`, `rounded-2xl`, `rounded-[...]`
- `bg-stone-*`, `bg-white`, `bg-amber-*`, `bg-red-*`, `bg-blue-*`
- `border-stone-*`, `border-amber-*`, `border-red-*`, `border-blue-*`
- `text-stone-*`, `text-amber-*`, `text-red-*`, `text-blue-*`
- 직접 `button/input/select/textarea` className 조합

## 예외 대상
아래는 실제 원형 또는 canvas/viewport 의미가 있어 직접 shape가 남을 수 있다.

- status dot
- spinner
- progress node
- drawing canvas overlay/brush/color chip
- full-screen modal reset의 `rounded-none`
- skeleton loading placeholder

## 다음 버전 후보
0.21.27부터는 작업지시서 기준을 발주 화면으로 확장한다. 단, 작업지시서에서 발견되는 추가 direct style은 우선 제거한다.
