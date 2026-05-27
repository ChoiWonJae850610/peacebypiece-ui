Version : 0.17.29
Summary : 작업지시서 발주 정보 로스비와 검수 버튼 위치 보정
Description : 발주 정보의 검수 진행 버튼을 진행 단계 영역으로 이동하고 비용 요약 헬프 문구를 제거했습니다. 추가 공정 로스비 입력과 저장 컬럼을 추가했으며 제작/추가 공정 금액 계산식을 수량 × (단가 + 로스비) 기준으로 통일했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/hooks/workorder/detailEditor/itemMutations.ts
- lib/workorder/detail/detailCalculations.ts
- lib/workorder/derived/workOrderCostSummary.ts
- lib/workorder/productionCompositionSnapshot.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/workorder/repository/dbWorkOrderDetailRows.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- types/workorder.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
추가 파일 목록 :
- db/migrations/patch_0_17_29_outsourcing_loss_cost.sql
삭제 파일 목록 :
- 없음
