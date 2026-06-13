# 0.21.91 Empty Workspace State 공통화

## Summary
- 작업지시서와 발주서의 빈 상태 UI를 `WaflEmptyWorkspaceState`로 공통화했다.
- 발주서 선택 전 가운데 패널과 우측 패널 문구/형태를 작업지시서와 동일한 톤으로 정리했다.
- 발주 품목 빈 상태 문구를 `발주 품목이 없습니다.`로 변경했다.

## 변경 사항
- `WaflEmptyWorkspaceState` 추가
  - `center-panel`
  - `side-panel`
  - `inline-section`
- 작업지시서 빈 상태가 신규 공통 컴포넌트를 사용하도록 변경
- 발주서 상세 패널 선택 전 상태가 신규 공통 컴포넌트를 사용하도록 변경
- 발주서 우측 발주 대상 패널의 선택 전 문구를 `~ 선택해 주세요` 톤으로 통일
- 발주 품목 빈 상태를 `~ 추가하세요`에서 `~ 없습니다.` 정책으로 변경

## 확인 필요
- PC 3패널에서 작업지시서/발주서 선택 전 Empty State 위치와 높이
- 아이패드 미니 가로 2패널에서 발주서 우측 Empty State
- 모바일/태블릿 세로에서 inline-section 빈 상태 높이
