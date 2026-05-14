Version :
0.11.90

Summary :
작업지시서 생산구성 단위 표시 정규화

Description :
작업지시서 생산구성 화면에서 기존 데이터나 mock 데이터에 남아 있는 yd, ea, pcs 계열 단위값이 사용자 화면에 그대로 노출되지 않도록 자재 단위 표시와 저장 값을 표준 단위 기준으로 정규화했다. 원단 기본 단위는 야드, 부자재 계열 단위는 개로 표시되도록 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/constants/material.ts
- lib/workorder/detail/detailCalculations.ts
- lib/workorder/material/materialDefaults.ts
- lib/hooks/workorder/detailEditor/materialMutations.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/presentation/workOrderValuePresentation.ts
- components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection.tsx
- lib/data/mock/workorders.ts

추가 파일 목록 :
- docs/workorder-production-composition-unit-display-0.11.90.md

삭제 파일 목록 :
없음
