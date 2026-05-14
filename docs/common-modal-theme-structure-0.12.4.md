# 0.12.4 공통 모달 theme 적용 구조 점검

## 목적

작업지시서 개별 모달을 각각 수정하기보다, 공통 모달 계층이 먼저 theme semantic token을 타도록 정리한다.

## 적용 범위

- `components/common/modal/BaseModal.tsx`
- `components/common/modal/ModalBody.tsx`
- `components/common/modal/modalFieldClassNames.ts`
- `components/common/modal/modalActions.tsx`
- `components/common/modal/modalPresets.ts`
- `components/admin/layout/AdminModal.tsx`
- `app/globals.css`
- `lib/theme/themes/defaultLight.ts`
- `lib/theme/semanticThemeTokens.ts`

## 기준

- 모달 overlay는 `pbp-modal-overlay` 기준으로 통일한다.
- 모달 panel은 `pbp-modal-panel` 기준으로 유지한다.
- 모달 header/footer chrome은 `pbp-modal-chrome` 기준으로 유지한다.
- 모달 body는 `pbp-modal-body` 기준으로 추가한다.
- AdminModal section은 `pbp-modal-section` 기준으로 맞춘다.
- 공통 modal input/select/textarea는 field semantic class를 사용한다.
- modal footer action은 action semantic class를 사용한다.

## 이번 버전에서 하지 않은 것

- 개별 작업지시서 모달 내부 레이아웃 전면 수정
- 개인 환경설정과 theme id 연결
- 복수 theme file 추가
- 모달 UX 동작 변경

## 회귀 확인

- 모달 overlay가 이전처럼 표시되는지 확인한다.
- 모달 열림/닫힘, Escape 닫기, 배경 스크롤 차단, focus trap이 유지되는지 확인한다.
- AdminModal을 쓰는 관리자 화면의 modal surface/section/input/button tone이 깨지지 않는지 확인한다.
- 작업지시서 생성/담당자/재고/검수 등 공통 ModalShell 계열 모달이 기존 동작을 유지하는지 확인한다.
