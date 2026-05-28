Version : 0.17.85
Summary : 반응형 device hook과 원단·부자재 화면 분기 기반 추가
Description : 작업지시서의 화면 폭 판정 로직을 공통 hook으로 분리하고 원단·부자재 발주 화면에 PC/tablet/mobile 분기 기반을 추가했습니다. PC 3분할은 유지하고 tablet/mobile은 기존 패널을 재배치하는 안전한 1차 구조로 적용했습니다.
수정 파일 목록 :
- components/workorder/layout/useWorkOrderDeviceType.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/ui-responsive-device-switch-0.17.85.md
- lib/responsive/useResponsiveDeviceType.ts
삭제 파일 목록 :
