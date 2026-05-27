Version : 0.17.18
Summary : 작업지시서 생산구성 러프 입력 화면 1차 정리
Description : 작업지시서 상세의 원단·부자재/외주공정 입력을 실제 발주 상세가 아닌 러프 필요 항목 중심으로 단순화했습니다. PC/모바일/태블릿 섹션에서 거래처·단가·금액 입력 노출을 제거하고, 실제 확정 정보는 원단·부자재 발주 화면과 외주공정 화면에서 처리한다는 안내를 추가했습니다. 작업지시서 PDF 양식과 DB schema는 변경하지 않았고, 0.17.18 설계 문서를 추가했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
- docs/현재기준/0.17.18-workorder-rough-composition.md
삭제 파일 목록 :
- 없음
