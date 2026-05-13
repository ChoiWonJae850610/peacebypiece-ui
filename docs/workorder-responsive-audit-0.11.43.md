# 작업지시서 화면 모바일 1차 점검

Version : 0.11.43

## 목적

작업지시서 업무 화면의 모바일/태블릿 구조를 실제 보정 전에 먼저 점검한다. 이번 버전은 기능 수정이 아니라 점검 문서화 버전이다. 저장 방식, workflow 상태 변경, 첨부/R2 처리, 메모 처리, 발주정보/생산구성 저장 정책은 변경하지 않는다.

## 점검 대상

### 1. 작업지시서 workspace

- `components/workorder/WorkOrderWorkspace.tsx`
- `components/workorder/WorkOrderLayout.tsx`
- `components/workorder/layout/useWorkOrderDeviceType.ts`
- `components/workorder/layout/WorkOrderDetailMobileView.tsx`
- `components/workorder/layout/WorkOrderDetailTabletView.tsx`
- `components/workorder/layout/WorkOrderDetailDesktopView.tsx`

현재 구조는 device type에 따라 mobile/tablet/desktop view를 분기한다. 이 방식은 유지한다. 0.11.44 이후 보정은 view 분기 구조를 바꾸지 않고, 각 device view의 spacing, overflow, section stacking만 조정하는 것이 안전하다.

### 2. 작업지시서 목록

- `components/workorder/list/WorkOrderListCard.tsx`
- `components/workorder/WorkOrderEmptyState.tsx`
- `components/workorder/WorkOrderLoadingState.tsx`

점검 항목:

- 카드 제목이 긴 경우 줄바꿈이 자연스러운지
- workflow badge와 reorder/delete menu가 모바일에서 겹치지 않는지
- 메뉴 버튼이 write lock 상태에서 닫히는 기존 동작을 유지하는지
- 선택된 작업지시서 카드의 색상 대비가 모바일에서 충분한지
- 목록이 길어질 때 detail/side panel과 스크롤 충돌이 없는지

### 3. 작업지시서 상세 상단

- `components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection.tsx`
- `components/workorder/detail/WorkOrderHeaderSection.tsx`

점검 항목:

- 제목/담당자 즉시 저장 정책 유지
- 긴 제목 입력 시 card 폭 밖으로 밀리지 않는지
- 기본 정보 수정 모달 진입 버튼이 모바일에서 충분히 큰지
- status/stage 표시가 줄바꿈되어도 의미가 깨지지 않는지

주의: 제목과 담당자 변경은 즉시 DB 반영 정책이므로 0.11.44 보정에서도 저장 타이밍을 변경하지 않는다.

### 4. workflow action 영역

- `components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx`
- `components/workorder/detail/WorkOrderActionSection.tsx`

점검 항목:

- 주요 action button이 모바일에서 1열 또는 2열로 안정적으로 배치되는지
- 진행 중 상태 메시지와 버튼 disabled 상태가 겹치지 않는지
- write lock message가 버튼보다 위/아래에서 명확히 보이는지
- workflow 상태 변경 로직은 변경하지 않는다.

### 5. 발주정보 / 검수정보

- `components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx`
- `components/workorder/detail/sections/OrderInfoSection.tsx`
- `components/workorder/detail/modals/OrderInspectionModal.tsx`

점검 항목:

- 납기일/발주일 등 날짜 입력이 모바일에서 화면 밖으로 밀리지 않는지
- 수량/단가/검수 정보 input이 한 줄 강제 배치로 깨지지 않는지
- 발주정보 저장 버튼이 모바일에서 충분히 분리되어 있는지
- 검수 모달 footer button이 모바일에서 겹치지 않는지

주의: 발주정보와 생산구성 정보는 작업지시서의 버튼 액션으로 저장/업데이트하는 정책을 유지한다.

### 6. 생산구성 / 원단 / 부자재 / 외주공정

- `components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletProductionCompositionSection.tsx`
- `components/workorder/detail/sections/ProductionCompositionSection.tsx`
- `components/workorder/detail/sections/MaterialSection.tsx`
- `components/workorder/detail/sections/OutsourcingSection.tsx`

점검 항목:

- 반복 행 추가/삭제 버튼이 모바일에서 너무 작지 않은지
- 행 내부 input이 가로로 밀릴 경우 card stack 또는 내부 overflow 처리가 필요한지
- 긴 자재명/업체명/메모가 UI 폭을 깨지 않는지
- 저장 버튼 위치가 section 내부에서 명확한지

### 7. 디자인 첨부 / 문서 첨부 / 메모

- `components/workorder/sidepanel/WorkOrderSidePanelContainer.tsx`
- `components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx`
- `components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx`
- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`
- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`

점검 항목:

- 모바일 accordion이 과도하게 길어지지 않는지
- 디자인 첨부와 문서 첨부의 upload/delete/preview action이 구분되는지
- primary design 표시가 모바일에서 충분히 보이는지
- memo thread/reply 작성 영역이 키보드 표시 시 접근 가능한지
- 첨부 삭제 confirm과 R2 delete flow는 변경하지 않는다.

### 8. 생성/삭제/파트너 모달

- `components/common/modal/CreateWorkOrderModal.tsx`
- `components/common/modal/WorkOrderDeleteConfirmModal.tsx`
- `components/workorder/PartnerFactoryRegistryModal.tsx`
- `components/workorder/detail/shared/WorkOrderDetailSharedModals.tsx`

점검 항목:

- 모바일에서 모달 본문 높이와 footer button 접근성 확인
- 카테고리 select가 화면 밖으로 밀리지 않는지
- 삭제 확인 문구와 위험 action button이 충분히 분리되어 있는지
- partner/factory 등록 모달의 input stack 확인

## 0.11.44 수정 우선순위

1. 작업지시서 workspace/mobile detail wrapper의 padding과 overflow 보정
2. 작업지시서 목록 카드의 action menu와 긴 제목 줄바꿈 보정
3. 발주정보/생산구성 section의 input row stack 보정
4. side panel 모바일 accordion과 첨부 action button 접근성 보정
5. 생성/삭제 모달 footer button 모바일 배치 보정

## 0.11.44에서 하지 말아야 할 것

- workflow 상태 enum/schema 변경
- 작업지시서 저장 정책 변경
- 제목/담당자 즉시 저장 정책 변경
- 발주정보/생산구성 버튼 저장 정책 변경
- 첨부/R2 upload/delete/restore/purge 흐름 변경
- 메모 thread/reply 저장 구조 변경
- DB schema 변경

## 결론

작업지시서 화면은 이미 mobile/tablet/desktop view가 분리되어 있으므로, 0.11.44에서는 구조 재작성보다 기존 device view 내부의 spacing, overflow, button stack, modal footer만 제한적으로 보정하는 것이 적절하다.
