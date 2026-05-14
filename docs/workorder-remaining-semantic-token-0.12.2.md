# 작업지시서 잔여 semantic token 적용 — 0.12.2

## 목적

0.12.2는 작업지시서 화면에서 theme file 분리 전에 남아 있던 잔여 UI 영역을 semantic token 기준으로 정리한다.

이번 버전은 실제 테마 선택 UI를 연결하지 않는다. 컴포넌트가 색상값 또는 특정 색상명에 직접 의존하지 않고 `pbp-*` 의미 class를 사용하도록 적용 범위를 넓히는 작업이다.

## 적용 범위

- 기본정보 수정 modal
  - 카테고리 선택 영역: `field.selectable`
  - 미리보기 요약: `field.readonly`
- workflow action section
  - workflow wrapper: card-muted 계열
  - 주요 액션: `action.primary`
  - 보조 액션: `action.secondary`
  - 현재 단계: `surface.selected`
  - 처리 메시지: muted/read-only 계열
- 비용 요약 카드
  - 세부 비용 행: calculated tone
  - 총 금액: primary/accent 기반 강조 tone
  - 비어 있는 외주공정 요약: empty state
- 작업지시서 header/detail summary card
  - tablet/mobile header card: semantic card
  - 기본정보/담당자/재고 버튼: selectable summary action
  - 제목 수정 입력: editable field

## 유지한 것

- workflow 상태 자체의 의미색은 기존 status presentation 기준을 유지한다.
- 실제 theme provider, 개인 설정, 테마 선택 UI는 연결하지 않는다.
- R2/첨부/메모/휴지통/purge 흐름은 변경하지 않는다.

## 후속 작업

다음 단계에서는 현재 default-light theme file 구조를 기반으로 테마를 runtime에 적용하는 provider 구조를 설계한다.
