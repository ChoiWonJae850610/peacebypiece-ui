Version : 0.15.77
Summary : 발주정보 draft 저장 흐름 보정
Description : 작업지시서 저장 버튼이 상세 화면의 현재 발주정보, 원단정보, 외주정보 draft snapshot을 직접 저장하도록 연결하고, workflow 검증에 사용하는 draft snapshot의 대표 발주정보 요약값을 보강했습니다. 저장 전 편집값은 로컬 draft로 유지하며, 명시 저장 버튼에서만 생산구성 저장 serviceCode로 DB에 반영되도록 정리했습니다.
수정 파일 목록 :
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/workorder/workspace/viewModelTypes.ts
추가 파일 목록 :
삭제 파일 목록 :
