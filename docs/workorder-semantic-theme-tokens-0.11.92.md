# 0.11.92 작업지시서 semantic theme token 1차 기준

## 목적

작업지시서 화면에서 색상값을 직접 고르기보다 UI 의미를 먼저 정의하고, 실제 색상은 향후 테마 파일에서 교체할 수 있게 한다.

## 1차 semantic token 그룹

- surface: page, card, cardMuted, selected, emptyState
- text: primary, secondary, muted, subtle, inverse
- action: primary, secondary, add, danger, dangerSoft
- status: success, warning, danger, pending, neutral
- field: editable, selectable, calculated, readonly, disabled
- border: default, strong, selected, focus
- feedback: focusRing, hover, pressed

## 작업지시서 생산구성 필드 의미

- editable: 수량, 단가, 메모처럼 사용자가 직접 입력하는 값
- selectable: 구분, 거래처, 자재명 후보, 단위, 공정, 외주처, 단가 기준처럼 선택하는 값
- calculated: 금액, 합계처럼 계산되어 직접 입력하지 않는 값
- readonly: 현재 상태에서 표시만 하는 값
- disabled: 권한이나 상태 때문에 수정할 수 없는 값

## 이번 버전 적용 범위

- PC/tablet 생산구성 입력 필드의 과한 검은 테두리를 제거한다.
- editable/selectable/calculated 의미를 CSS class와 변수 기준으로 분리한다.
- 실제 테마 선택 UI와 테마 파일 분리는 다음 단계에서 진행한다.
