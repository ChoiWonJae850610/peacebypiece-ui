# 0.17.87 UI responsive segmented tabs

## 목적

원단·부자재 태블릿/모바일 화면의 패널 전환 버튼을 화면 파일 내부의 임시 버튼 묶음에서 공통 UI 래퍼로 분리한다.

## 적용 범위

- `components/common/ui/AppSegmentedTabs.tsx` 추가
- `features/material-orders/MaterialOrderDraftEditor.tsx`의 모바일/태블릿 패널 전환 UI에 적용

## 설계 기준

- 화면 파일은 `AppSegmentedTabs`만 사용한다.
- shadcn/Radix 계열 컴포넌트를 화면 파일에 직접 흩뿌리지 않는다.
- 모바일/태블릿 탭 구조는 공통 래퍼를 통해 WAFL 톤으로 통일한다.
- PC 3분할 레이아웃은 변경하지 않는다.
- 저장, 상태 전환, 자재 계산, API/DB 흐름은 변경하지 않는다.

## 다음 점검

- 모바일에서 상단 전환 바가 과하게 높거나 답답해 보이는지 확인
- 태블릿에서 우측 상세/자재 전환이 충분히 명확한지 확인
- 이후 Sheet/Drawer 적용이 필요하면 이 래퍼와 별도 `AppSheet` 계층으로 분리
