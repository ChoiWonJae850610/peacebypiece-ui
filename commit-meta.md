Version : 0.11.78
Summary : 생산구성 선택 안함 표시와 카드 depth 보정
Description : 원단/부자재 및 외주공정의 선택 안함 상태에서 거래처/외주처 후보가 빈 줄로 보이지 않도록 등록된 업체 없음 선택 불가 옵션을 표시하고, 0.11.77 build error 원인이던 원단 기본 단위 타입을 MATERIAL_UNIT 상수 기준으로 보정했습니다. 생산구성 내부 카드 depth와 발주정보 padding을 줄이고 원단/부자재 및 외주공정 table column 폭을 조정해 단위/단가기준 표시가 잘리지 않도록 보정했습니다.
수정 파일 목록 :
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/workorder/detail/detailSelectors.ts
- lib/hooks/workorder/detailEditor/materialMutations.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-production-composition-card-depth-0.11.78.md
삭제 파일 목록 :
