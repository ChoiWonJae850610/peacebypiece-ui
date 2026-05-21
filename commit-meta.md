Version :
0.15.43

Summary :
작업지시서 생산구성 workflow action snapshot 보강

Description :
작업지시서 검토요청 실행 시 부모 selectedWorkOrder 반영 타이밍에 의존하지 않고 detail editor의 현재 orderEntries, materials, outsourcing 및 활성 편집 값을 snapshot으로 전달하도록 보강했다. 원단, 부자재, 외주공정, 공장 수량·단가가 검토요청 후 0으로 떨어지는 문제를 줄이기 위한 흐름이다.

수정 파일 목록 :
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/workorder/workspace/viewModelTypes.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/66_wafl-a-type-workorder-production-snapshot-action.md

삭제 파일 목록 :
없음
