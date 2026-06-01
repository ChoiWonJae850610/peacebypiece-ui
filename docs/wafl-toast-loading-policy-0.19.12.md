# 0.19.12 WAFL Toast loading 정책 보정

## 목적

0.19.10에서 우측 하단으로 정리되던 floating toast를 폐기하고, 사용자가 기준으로 인식하던 중앙 하단 pill형 toast를 WAFL Toast 공식 기준으로 다시 고정한다.

## 공식 기준

- 위치: 화면 하단 중앙 fixed layer
- 형태: pill/capsule형 둥근 toast
- 타입: `success`, `danger`, `warning`, `info`, `loading`
- 긴 메시지: 최대 폭을 넓히고 2줄 이상 자연스럽게 줄바꿈한다.
- 모바일: 좌우 safe area를 확보하고 화면 폭을 넘기지 않는다.

## loading toast 정책

DB/API/화면 전환처럼 사용자가 기다려야 하는 동작에는 loading toast를 짧게 표시한다.

적용 대상:

- 고객사 홈 카드/버튼으로 화면 이동
- 작업지시서 상세 불러오기/저장 중 표시
- 원단·부자재 발주 상태 변경
- 저장소 삭제/복원/비우기 처리
- 멤버 초대/취소 처리
- 협력업체 저장 처리

제외 대상:

- 단순 탭 전환
- 입력 필드 변경
- 정렬/필터처럼 즉시 반응하는 프론트 상태 변경
- 화면 내부 empty/loading/error 안내 박스

## 0.19.12 반영 내용

- `AppToaster` 위치를 `bottom-center`로 변경했다.
- `ToastMessage`의 tone에 `loading`을 추가했다.
- `showWaflToast`, `showWaflLoadingToast`를 공통 호출 함수로 추가했다.
- 고객사 홈 카드 이동과 일반 멤버 홈 카드 이동에 loading toast를 연결했다.
- 작업지시서 write lock/처리중 표시를 중앙 하단 WAFL Toast 스타일에 맞췄다.
- 원단·부자재 발주 상태 변경 시작 시 loading toast를 표시한다.

## 변경 금지 범위

- DB/API/R2 흐름 변경 없음
- 작업지시서 상태 머신 변경 없음
- 저장소 삭제/복원/purge 흐름 변경 없음
- 원단·부자재 계산식 변경 없음
- 멤버/협력업체 저장 로직 변경 없음
