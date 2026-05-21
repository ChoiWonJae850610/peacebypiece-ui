# WAFL A-Type — Production Composition Read Numeric Mapping

## Version
0.15.46

## Purpose
생산구성 값이 DB에는 저장되어 있지만 화면 조회 시 수량·단가·금액이 `0`으로 표시되는 문제를 조회 mapper 기준으로 보정한다.

## Cause
PostgreSQL `numeric` 계열 값은 런타임에서 문자열로 반환될 수 있다. 기존 작업지시서 상세 조회 mapper는 `typeof value === "number"`인 경우만 숫자로 인정했기 때문에, DB에는 `quantity`, `unit_cost`, `total_cost`, `labor_cost`, `loss_cost`가 들어 있어도 화면 복원 과정에서 `0` fallback으로 떨어질 수 있었다.

## Scope
- `orders.quantity`, `orders.labor_cost`, `orders.loss_cost`
- `spec_sheet_materials.quantity`, `spec_sheet_materials.unit_cost`, `spec_sheet_materials.total_cost`
- `spec_sheet_outsourcing_lines.quantity`, `spec_sheet_outsourcing_lines.unit_cost`, `spec_sheet_outsourcing_lines.total_cost`

## Decision
저장 경로는 더 건드리지 않는다. DB row를 WorkOrder row로 복원하는 단계의 `readNumberRowValue`만 보강한다.

## Verification
- 디자이너가 원단/부자재/외주/공장 숫자값을 입력한다.
- 검토 요청으로 DB에 확정 저장한다.
- 관리자 계정으로 동일 작업지시서를 조회한다.
- DB에 저장된 숫자값과 화면 표시값이 일치하는지 확인한다.
