# WAFL Control Radius Correction 0.21.45

## 목적
0.21.44에서 전체 radius를 더 직각적인 업무형 기준으로 낮춘 뒤, 일부 검색 필드가 기본 브라우저 input처럼 너무 직각적으로 보이는 문제를 1차 보정한다.

## 기준
- 큰 surface/card/panel은 과하게 둥글지 않은 업무형 곡률을 유지한다.
- input/select/button 같은 control 계열은 서로 같은 곡률을 가져야 한다.
- 검색 필드는 select와 같은 `wafl-shape-control` 기준을 명시적으로 사용한다.
- 직접 `rounded-*` 추가 대신 WAFL Foundation shape class를 사용한다.

## 수정 범위
- 공통 필터 검색 input 클래스에 `wafl-shape-control`을 명시했다.
- 검색 input에 border width, padding, text size, outline/focus 기준을 함께 명시해 select와 시각 밀도를 맞췄다.
- 협력업체뿐 아니라 `WaflFilterBar`를 사용하는 저장소/멤버/목록 계열 화면에 같은 control 기준이 적용된다.

## 변경하지 않은 것
- DB 스키마 변경 없음
- 발주 기능 로직 변경 없음
- 직접 화면별 radius 값 추가 없음
- rounded-full/dot/avatar/progress 예외 기준 변경 없음
