# 0.17.86 원단·부자재 tablet/mobile 패널 전환 1차

## 목적

원단·부자재 발주 화면은 PC에서 3분할 구조를 유지하되, tablet/mobile에서는 3개 패널을 한 번에 모두 노출하지 않도록 화면 전환 기반을 추가한다.

## 변경 기준

- desktop: 기존 3분할 유지
- tablet: 좌측 발주서 목록 + 우측 상세/자재 선택 탭 전환
- mobile: 발주서 / 상세 / 자재 탭 전환

## 적용 범위

- `features/material-orders/MaterialOrderDraftEditor.tsx`
- 저장 로직, 상태 전환, 자재 계산, DB/API 흐름은 변경하지 않는다.
- UI 래퍼는 기존 `AppButton`만 사용한다.

## 후속 검토

- 실제 tablet 폭에서 우측 상세/자재 선택 탭 전환이 충분한지 확인한다.
- 실제 mobile에서 발주서 선택 후 상세 탭으로 자동 이동하는 흐름을 확인한다.
- 자재 선택 탭이 길게 느껴지면 다음 단계에서 Sheet/Drawer 구조로 전환한다.
