# 65. 작업지시서 생산구성 숫자 입력값 실시간 draft 반영

## 목적

디자이너가 작업지시서에서 원단, 부자재, 외주공정의 수량/단가를 입력한 뒤 별도 저장이나 다른 영역 클릭 없이 바로 검토요청을 누르는 경우에도 숫자 입력값이 누락되지 않도록 한다.

## 확인된 문제

0.15.40과 0.15.41에서는 생산구성 row 자체는 검토요청 시 state patch에 포함되도록 보강되었지만, 숫자 input의 현재 편집값이 아직 local editor state에만 머문 상태에서 workflow action이 실행될 수 있었다.

그 결과 공장, 자재명, 단위, 단가기준처럼 select/text로 이미 반영된 값은 유지되지만 수량, 단가, 금액은 0으로 저장되는 상황이 발생할 수 있었다.

## 0.15.42 조정

- 원단/부자재 `quantity`, `unitCost` 입력 중 변경값을 editor local state와 workorder draft patch에 즉시 반영한다.
- 외주공정 `quantity`, `unitCost` 입력 중 변경값을 editor local state와 workorder draft patch에 즉시 반영한다.
- 공장 발주 row의 `quantity`, `laborCost`, `lossCost` 입력 중 변경값도 같은 방식으로 반영한다.
- 기존 blur/Enter commit 흐름은 유지한다.
- DB schema, API 응답 포맷, R2 흐름은 변경하지 않는다.

## 회귀 테스트

1. 디자이너로 작업지시서 생성
2. 공장 2개 이상 입력
3. 원단 2개 이상 입력
4. 부자재 2개 이상 입력
5. 외주공정 1개 이상 입력
6. 각 row의 수량/단가 입력 직후 다른 곳을 클릭하지 않고 바로 검토요청
7. 관리자 계정으로 같은 작업지시서 확인
8. 모든 수량/단가/금액이 0으로 떨어지지 않는지 확인
