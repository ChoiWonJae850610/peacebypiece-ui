# 0.11.91 작업지시서 생산구성 입력/계산 필드 시각 구분

## 목적

작업지시서 생산구성 화면에서 사용자가 입력하거나 선택할 수 있는 필드와 자동 계산되는 필드를 시각적으로 구분한다.

## 적용 범위

- PC 원단/부자재 table
- PC 외주공정 table
- 태블릿 원단/부자재 카드형 입력 영역
- 태블릿 외주공정 카드형 입력 영역
- 공통 EditableValue 표시 상태

## 표시 기준

- 입력/선택 가능 필드: `pbp-workorder-editable-*` 계열 class 사용
- 계산/읽기 전용 필드: `pbp-workorder-calculated-*` 계열 class 사용
- 색상 값은 `app/globals.css`의 CSS variable을 통해 관리한다.

## 후속 작업

모바일 생산구성 카드 전체 구조는 다음 버전에서 별도 정리한다. 이번 버전에서는 공통 EditableValue 표시 상태의 기본 색상만 함께 영향을 받는다.
