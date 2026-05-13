# 관리자 모달 공통화 1차 (0.11.36)

## 목적

0.11.35 모달 패턴 조사 결과를 기준으로, 위험도가 낮은 시스템관리자 기준정보 모달 일부를 `AdminModal` 패턴으로 전환했다.

## 적용 범위

### 전환 파일

- `components/system/category-rules/CategoryRuleTestModal.tsx`
- `components/system/category-rules/CategoryValuesModal.tsx`

### 변경 내용

- `ModalShell` 직접 사용을 `AdminModal` 사용으로 전환했다.
- 테스트 모달 본문은 `AdminModalSection` 안에 배치해 관리자/시스템관리자 모달의 카드형 본문 패턴과 맞췄다.
- 카테고리 값 관리 모달의 footer action 구조는 기존 버튼 컴포넌트를 유지한 채 `AdminModal` footer로만 연결했다.

## 변경하지 않은 것

- 카테고리 규칙 저장 로직
- 카테고리 값 reset/save 로직
- 1차/2차/3차 카테고리 rename/remove/add 로직
- 모바일 drawer 구조
- 저장소/휴지통/R2 purge 모달
- 작업지시서 관련 모달

## 판단

`CategoryRuleTestModal`과 `CategoryValuesModal`은 system 기준정보 화면 안의 보조 모달이고, 삭제/복원/R2 purge 같은 고위험 action flow와 직접 연결되지 않는다. 따라서 1차 전환 대상으로 적합하다.

## 후속 작업 후보

- 0.11.37에서 저장소 confirm modal 또는 기준정보 잔여 모달 중 위험도 낮은 영역 추가 전환
- `ModalShell`을 계속 써야 하는 작업지시서/공통 업무 모달은 별도 분류 유지
- 삭제/복원 관련 모달은 실제 action flow 회귀 테스트와 함께 별도 전환
