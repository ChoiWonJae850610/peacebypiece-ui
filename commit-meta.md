Version :
0.11.87

Summary :
작업지시서 생산구성 선택 안함 표시 보정

Description :
작업지시서 생산구성의 원단, 부자재, 외주공정 선택 안함 상태에서 표시값을 -로 통일하고, 거래처와 외주처 편집 후보는 등록된 업체 없음으로 보이도록 PC, 모바일, 태블릿 화면 표시 기준을 공통 helper로 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection.tsx

추가 파일 목록 :
- lib/workorder/detail/selectDisplayPresentation.ts
- docs/runtime-mode-production-composition-select-display-0.11.87.md

삭제 파일 목록 :
없음
