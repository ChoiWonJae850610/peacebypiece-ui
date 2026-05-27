Version : 0.17.25
Summary : 외주공정 발주 정보 내부 배치 1차
Description : 작업지시서 PC 발주 정보 영역 안에 외주공정 발주 블록을 추가했습니다. 생산 공장은 작업지시서당 1개 기준으로 유지하고, 외주공정은 여러 개 추가할 수 있도록 공정/외주처/납기일/수량/외주비 입력 구조를 배치했습니다. 외주공정 추가 시 대표 생산 공장의 납기일과 수량을 기본값으로 가져오도록 했으며, 생산 구성 영역은 필요 원단/부자재 중심으로 유지했습니다. DB schema와 작업지시서 PDF 양식은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/hooks/workorder/detailEditor/itemMutations.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- types/workorder.ts
추가 파일 목록 :
- docs/현재기준/0.17.25-outsourcing-inside-order-info.md
삭제 파일 목록 :
- 없음
