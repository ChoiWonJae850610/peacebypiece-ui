Version : 0.10.44
Summary : 고객관리자 기준정보 업무 화면 연결
Description : 생산품 유형 기본값 복원 후 저장이 회사 전용 기준정보로 유지되도록 조회 기준을 보정했습니다. 고객관리자가 사용 처리한 단위 표준을 작업지시서 자재 단위 선택지에 연결하고, 외주 단가 기준은 사용 단위에서 “단위명당” 형태로 파생되도록 했습니다. 외주공정 유형은 기존 협력업체 등록/수정 모달의 고객사 사용 여부 기반 선택 흐름을 점검하고 유지했습니다. DB schema와 시스템 기준정보 원장 CRUD, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/settings/standardsRepository.ts
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection.tsx

추가 파일 목록 :
- lib/admin/settings/useCompanyStandardOptions.ts
- docs/admin-standards-workflow-options-0.10.44.md

삭제 파일 목록 :
- 없음
