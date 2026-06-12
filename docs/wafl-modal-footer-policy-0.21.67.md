# WAFL Modal Footer Policy 0.21.67

## 목적

WAFL 공통 모달의 footer 정책을 단순화한다.

## 기준

- 모든 모달은 우측 상단 `닫기` 버튼으로 닫는다.
- 모달 footer에는 실제 실행 action만 표시한다.
- `취소`, `닫기` 등 secondary dismiss 버튼은 footer에서 렌더링하지 않는다.
- 배경 클릭 닫힘 차단 정책은 유지한다.

## 적용 방식

`renderModalFooterActions`는 `secondary` 설정을 더 이상 렌더링하지 않는다. 기존 호출부의 `secondary` prop은 하위 호환을 위해 타입만 유지한다.

## 확인 대상

- 작업지시서 생성 모달
- 작업지시서 삭제 모달
- 첨부파일 삭제 모달
- 공정/자재 수정 모달
- 발주 품목 수정 모달
- 진행 전 확인 모달
