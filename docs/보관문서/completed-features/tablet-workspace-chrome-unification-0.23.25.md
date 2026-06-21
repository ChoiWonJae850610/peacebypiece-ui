# 0.23.25 태블릿 workspace chrome 통합 정비

## 목적

작업지시서와 발주서가 공통 workspace frame을 사용하더라도 Topbar 정렬과 태블릿 목록 드로어 폭·높이가 기기별로 다르게 보일 수 있던 부분을 공통 정책으로 정리한다.

## 변경

- 768px 이상에서는 Topbar 제목과 액션 영역을 동일 행으로 정렬한다.
- Topbar slot, action row, 태블릿 목록 드로어 폭과 본문 높이 class를 공통 chrome 정책 파일로 이동한다.
- 태블릿 목록 드로어 폭은 최대 420px, viewport의 82% 이내로 제한한다.
- 태블릿 목록 본문은 고정 `72dvh` 대신 드로어 전체 가용 높이를 사용한다.
- 작업지시서와 발주서 모두 공통 `WaflTabletWorkspaceFrame`을 통해 같은 정책을 적용받는다.

## 비변경

- API, DB, 저장 흐름, 상태 전환, breakpoint 판정은 변경하지 않는다.
