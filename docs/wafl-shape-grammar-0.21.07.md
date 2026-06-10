# WAFL Shape Grammar 0.21.07

## 목적

`/ui` 확인 중 버튼과 배지가 알약형으로 보이고, Surface/Input/InfoBox 같은 컨테이너는 둥근 네모형으로 보여 WAFL 내부 shape 문법이 섞여 보이는 문제가 있었다.

이번 버전은 버튼, 배지, 입력창, 필터, Surface, Table 계열의 기본 곡률을 같은 둥근 네모 계열로 맞추는 1차 보정이다.

## 변경 기준

- WAFL 기본 shape는 pill이 아니라 rounded rectangle로 본다.
- 역할 구분은 모서리 모양이 아니라 tone, variant, fill, border, typography, spacing으로 만든다.
- `rounded-full`은 아바타, 진행 점, 순수 원형 아이콘처럼 실제 원형 의미가 있을 때만 예외로 둔다.
- 작은 badge와 icon button은 큰 카드와 같은 계열이지만 시각적으로 무너지지 않도록 compact/icon radius token을 사용한다.

## 토큰

- `--pbp-radius-wafl: 16px`
- `--pbp-radius-wafl-compact: 8px`
- `--pbp-radius-wafl-icon: 12px`

## 주요 반영

- `WaflButton` icon variant의 원형 radius 제거
- `AppBadge` pill 느낌 완화를 위해 compact radius 적용
- `WaflActionButton` 원형 radius 제거
- `WaflAddIconBubble` 원형 bubble을 rounded rectangle 계열로 변경
- `WaflDataTable` shell/header button/mobile card radius token 정리
- `adminSemanticClassNames`의 주요 panel/input/pill class를 WAFL radius token 기준으로 정리
- `/ui`에 Shape grammar 섹션 추가

## 미반영 범위

- 업무 로직 변경 없음
- 데이터 조회/저장/삭제 로직 변경 없음
- 날짜 선택기 내부의 달력 day circle 같은 원형 의미 요소는 이번 범위에서 제외
- 아바타, 상태 점, 진행 점처럼 원형 의미가 있는 요소는 유지 가능

## 확인 포인트

1. `/ui`의 Shape grammar 섹션에서 버튼, 배지, 입력창, InfoBox가 같은 둥근 네모 계열로 보이는지 확인한다.
2. Touch actions 섹션의 버튼이 알약처럼 보이지 않는지 확인한다.
3. AppBadge가 pill이 아니라 작은 rounded rectangle처럼 보이는지 확인한다.
4. 저장소/통계/멤버관리/협력업체의 필터, 버튼, table row가 과도하게 알약형으로 보이지 않는지 확인한다.
