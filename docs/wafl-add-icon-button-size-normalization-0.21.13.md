# WAFL Add/Icon Button Size Normalization 0.21.13

## 목적

0.21.12에서 `WaflIconButton / WaflMoreActionButton` 공통화 1차를 진행했지만, 실제 작업지시서 화면에서 목록 카드의 `...` 버튼, 제작 공정 카드의 `...` 버튼, 우측 패널의 `+` 버튼 크기가 서로 다르게 보였다.

0.21.13은 버튼 계열을 같은 공통 경로로 연결한 뒤, 크기 기준을 명확히 잡는 단계다.

## 기준

- `sm`: 28 x 28
- `md`: 32 x 32
- `lg`: 36 x 36
- 작업지시서 more/add 버튼의 기본값은 `md`로 둔다.
- 카드 내부 `...` 버튼과 우측 패널 `+` 버튼은 모두 WAFL action button size token을 기준으로 한다.

## 반영

- `WaflActionButton` size map을 28/32/36 기준으로 조정했다.
- `WaflAddActionButton`을 추가해 `+` 액션 버튼을 공통 primitive로 분리했다.
- `WorkOrderAddIconButton`은 `WaflAddActionButton`을 사용한다.
- `WorkOrderMoreIconButton` 기본 size를 `md`로 조정했다.
- 작업지시서 목록 카드의 `...` 버튼도 `md`를 사용한다.
- `WaflAddIconBubble` 기본 크기를 32px로 조정했다.
- 우측 첨부 패널의 별도 `h-10 w-10` bubble override를 제거했다.

## 아직 남은 일

- 발주/저장소/통계/멤버관리의 직접 icon button 잔여 요소 정리
- AddCardButton과 AddIconBubble 관계 최종 단순화
- 화면별 위치(top/right) 보정
