Version :
0.11.91

Summary :
작업지시서 생산구성 입력 가능 필드와 계산 필드 시각 구분

Description :
작업지시서 생산구성의 원단·부자재와 외주공정 영역에서 입력/선택 가능한 필드와 자동 계산되는 금액 필드를 구분하는 공통 시각 토큰을 추가했다. PC 테이블과 태블릿 입력 패널에 해당 기준을 적용하고, 추후 테마 변경이 가능하도록 색상 기준을 globals.css의 CSS 변수로 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- components/workorder/detail/shared/detailEditorShared.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection.tsx

추가 파일 목록 :
- docs/workorder-production-composition-field-visuals-0.11.91.md

삭제 파일 목록 :
없음
