Version :
0.11.96

Summary :
모바일 생산구성 카드 semantic token 적용

Description :
작업지시서 모바일 원단/부자재와 외주공정 카드에서 입력 가능 항목, 선택 가능 항목, 계산 항목을 semantic field token 기준으로 구분했다. 모바일 생산구성 카드와 선택 가능 패널 class를 공통 detail editor shared class로 분리하고, semantic theme token 설명과 문서를 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/workorder/detail/shared/detailEditorShared.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection.tsx

추가 파일 목록 :
- docs/workorder-mobile-composition-semantic-token-0.11.96.md

삭제 파일 목록 :
없음
