# 0.11.98 작업지시서 모바일 모달 검색 입력 포커스 보정

## 목적

모바일 모달 안의 검색/입력 필드에서 한 글자를 입력한 뒤 포커스가 빠지는 문제를 보정한다.

## 원인 판단

공통 모달 환경 hook이 `onClose` 함수를 effect dependency로 직접 사용하고 있었다. 부모 컴포넌트가 검색어 또는 입력값 변경으로 리렌더링되면 `onClose` 함수 참조가 바뀔 수 있고, 이때 모달 환경 effect가 cleanup 후 재등록되면서 이전 포커스 복원 로직이 실행될 수 있다.

모바일 입력창에서는 이 동작이 검색 input 포커스 이탈처럼 보일 수 있다.

## 변경 내용

- `useModalEnvironment` 내부에 `onCloseRef`를 추가했다.
- 최신 `onClose`는 ref로 갱신한다.
- 모달 환경 effect는 `open`, `dialogRef`, `modalId` 기준으로만 유지한다.
- Escape 닫기 동작은 `onCloseRef.current()`를 호출하도록 변경했다.
- 배경 스크롤 차단, focus trap, Tab 순환, 닫힌 뒤 이전 포커스 복원 흐름은 유지했다.

## 확인 기준

- 모바일 모달 검색 input에서 한 글자 입력 후 포커스가 유지되는지 확인한다.
- 한글 조합 입력 중에도 input이 재마운트되거나 포커스를 잃지 않는지 확인한다.
- Escape 닫기 동작이 유지되는지 확인한다.
- 배경 스크롤 차단이 유지되는지 확인한다.
- PC / tablet 모달의 Tab focus trap 동작이 유지되는지 확인한다.
