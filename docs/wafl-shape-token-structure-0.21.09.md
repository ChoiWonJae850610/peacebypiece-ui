# WAFL Shape Token 구조화 0.21.09

## 목적

WAFL 컴포넌트가 화면별로 `rounded-full`, `rounded-2xl`, `rounded-[24px]` 등을 직접 조합하지 않도록 shape 기준을 token과 공통 class로 구조화한다.

## Shape token

- `--pbp-radius-wafl-surface: 16px`
  - card, panel, info box, empty state, modal section
- `--pbp-radius-wafl-control: 10px`
  - button, input, select, filter control, small action surface
- `--pbp-radius-wafl-compact: 7px`
  - badge, chip, compact label
- `--pbp-radius-wafl-icon: 10px`
  - icon-only button, add icon bubble
- `--pbp-radius-wafl`
  - 기존 surface 계열 호환 alias

## 공통 class

- `wafl-shape-surface`
- `wafl-shape-control`
- `wafl-shape-compact`
- `wafl-shape-icon`

## 적용 범위

- WAFL 공통 버튼/배지/폼/서피스 컴포넌트
- WAFL admin 공통 테이블/필터/설정/세그먼트 컴포넌트
- `/ui` 카탈로그 shape 설명 섹션
- default light theme의 radius 변수

## 규칙

- WAFL UI에서 알약형을 만들기 위해 `rounded-full`을 쓰지 않는다.
- 실제 원형 의미가 있는 진행 점, 아바타, 스피너는 예외다.
- 작은 요소는 surface와 같은 radius 값을 쓰지 않는다. 작은 요소에는 작은 token을 써야 눈으로 같은 shape family처럼 보인다.
- 업무 화면은 직접 radius class를 추가하기보다 공통 컴포넌트 또는 `wafl-shape-*` class를 사용한다.

## 다음 점검

0.21.10에서는 작업지시서/발주/저장소 실제 화면에서 아직 남은 직접 radius 또는 pill 형태를 화면 단위로 점검한다.
