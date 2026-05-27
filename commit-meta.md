Version : 0.17.24
Summary : 작업지시서 단일 생산 공장 기준 정리
Description : 작업지시서 발주 정보에서 복수 공장/복수 발주 추가 흐름을 제거하고, 생산 공장은 작업지시서당 1개만 표시·관리하도록 정리했습니다. 기존 orderEntries 배열 구조와 DB schema는 유지하되 상세 화면과 추가 동작은 대표 생산 공장 1개 기준으로 제한했습니다. 공장 하나당 발주서 1개 생성 방향을 문서화하고, 외주공정은 다음 버전에서 발주 정보 내부의 별도 다중 블록으로 추가할 수 있도록 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
- docs/현재기준/0.17.24-single-factory-order-policy.md
삭제 파일 목록 :
- 없음
