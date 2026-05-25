# 67. 생산구성 확정 저장 정책과 workflow snapshot 보정

## 목적

0.15.44는 작업지시서의 발주 정보와 생산구성 입력값을 즉시 DB 저장 항목과 분리하고, 앞으로 진행되는 workflow 이벤트에서만 확정 저장하는 기준을 둔다.

## 문제 정리

첨부파일, 디자인, 메모, 담당자, 제목, 재고처럼 유실되면 안 되는 항목은 즉시 DB/R2 반영이 맞다. 반면 공장 발주 row, 원단/부자재 row, 외주공정 row는 사용자가 여러 항목을 편집하다가 검토요청 또는 발주요청 같은 진행 이벤트에서 한 번에 확정하는 성격이 강하다.

0.15.40~0.15.43에서는 생산구성 patch, 활성 입력값 flush, 실시간 draft, workflow action snapshot을 순차적으로 보강했다. 0.15.44에서는 빌드 타입 오류를 수정하고, 생산구성 확정 저장이 반려/취소성 상태 전환에서 임의로 발생하지 않도록 정책 함수를 추가했다.

## 즉시 저장 항목

- 작업지시서 제목
- 담당자
- 재고 수량과 재고 상태
- 첨부 파일
- 디자인 파일
- 메모
- 대표 디자인

## 확정 저장 항목

- 공장 발주 row
- 원단 row
- 부자재 row
- 외주공정 row
- 수량
- 단가
- 단가기준
- 금액

## 확정 저장 trigger

다음 workflow 상태로 진행할 때 생산구성 snapshot 저장을 허용한다.

- review_requested
- review_completed
- inspection
- completed

반려 상태로 돌아가거나 취소성 흐름을 탈 때는 입력 중 draft를 확정 저장하지 않는다. 기존 DB에 이미 확정된 값은 유지하고, 진행 이벤트에서만 새 생산구성 snapshot을 상세 테이블에 반영한다.

## 코드 기준

- `lib/workorder/productionCompositionPolicy.ts`
  - `shouldCommitProductionCompositionForWorkflowState`
  - `hasProductionCompositionDraft`
  - `shouldCommitProductionComposition`
- `lib/hooks/workorder/workorderRepositoryMutations.ts`
  - workflow state patch를 만들 때 생산구성 포함 여부를 정책 함수로 판단
- `lib/hooks/workorder/useWorkOrderDetailEditor.ts`
  - workflow action snapshot 생성 시 material editing value를 반영할 수 있도록 누락 import 보완

## 후속 과제

0.15.45 이후에는 실제 DB column mapping을 다시 점검한다.

- `orders.quantity/labor_cost/loss_cost`
- `spec_sheet_materials.quantity/unit_cost/total_cost`
- `spec_sheet_outsourcing_lines.quantity/unit_cost/total_cost`
- 디자이너 화면과 관리자 화면의 viewModel mapping
- 새 row 여러 개 입력 후 검토요청 시 숫자 필드 유지 여부
