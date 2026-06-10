# WAFL 작업지시서 Shape Token 연결 1차 (0.21.10)

## 목적

0.21.09에서 만든 WAFL shape token을 실제 작업지시서 화면의 잔여 버튼, 입력창, 배지, 아이콘 버튼에 연결한다.

## 핵심 기준

- `rounded-full`은 실제 dot/spinner처럼 원형 의미가 있는 요소에만 남긴다.
- 검색 input, 메모 input, CTA button, 댓글 button, 아이콘 button은 `wafl-shape-control` 또는 `wafl-shape-icon`을 사용한다.
- 상태 badge는 `wafl-shape-compact`를 사용한다.
- 화면 내부에서 직접 만든 버튼도 가능한 한 WAFL token class를 탄다.

## 이번 1차 대상

- 작업지시서 좌측 검색 input / 검색 초기화 button
- 작업지시서 목록 카드의 `...` action button과 menu item
- 중앙 진행 단계 footer의 자재 발주 대기 badge
- 우측 메모 input / 등록 / 취소 / 댓글 button
- 우측 메모 수정/삭제 icon button
- 첨부/디자인 primary button과 drag active panel
- 상단 toolbar icon button
- inline select editor input

## 남긴 예외

- 상태 dot
- spinner
- 디자인 캔버스 드로잉 툴의 실제 원형/브러시 preview

## 다음 단계

발주, 저장소, 통계, 멤버관리 화면의 직접 `rounded-*` 잔여 요소를 같은 방식으로 연결한다.
