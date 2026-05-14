Version : 0.11.77
Summary : 생산구성 선택 안함과 기본 단위 보정
Description : 작업지시서 생산구성에서 원단/부자재 구분이 선택 안함이면 거래처 후보를 비우고, 외주공정 공정 목록에도 선택 안함을 추가해 외주처 후보를 비우도록 보정했습니다. 원단 선택 시 야드, 부자재 선택 시 개, 신규 외주공정 단가 기준은 장당으로 기본 설정했습니다. 시스템 단위 표준에 개 단위를 추가하는 patch SQL과 full_reset/system seed 반영도 포함했습니다.
수정 파일 목록 :
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection.tsx
- lib/workorder/detail/detailSelectors.ts
- lib/hooks/workorder/detailEditor/materialMutations.ts
- lib/constants/workorderOptions.ts
- db/schema/full_reset.sql
- db/seed/system_standards_seed.sql
- lib/constants/app.ts
추가 파일 목록 :
- db/schema/patch_0_11_77_unit_each_standard.sql
- docs/qa-workorder-production-composition-unselected-units-0.11.77.md
삭제 파일 목록 :
