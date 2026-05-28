# UI system standards select application 0.18.04

## 목적

시스템 기준정보/카테고리 규칙 화면에 남아 있던 native select를 WAFL 공통 `AppSelect`로 1차 전환한다.

## 적용 범위

- `components/system/standards/SystemProcessStandardsPage.tsx`
  - 공정 추가 분류 선택
  - 공정 행 편집 분류 선택
- `components/system/standards/SystemUnitStandardsPage.tsx`
  - 단위 추가 분류 선택
  - 단위 행 편집 분류 선택
- `components/system/standards/SystemProductTemplateStandardsPage.tsx`
  - 분류 추가 템플릿 선택
  - 분류 단계 선택
  - 상위 분류 선택
- `components/system/category-rules/CategoryRuleEditorPanel.tsx`
  - 1차/2차/3차 카테고리 조건 선택

## 유지한 것

- 시스템 기준정보 생성/수정 로직
- 카테고리 규칙 저장/복제/삭제/테스트 로직
- DB/API 호출 흐름
- PC/tablet/mobile 레이아웃 구조
- 기존 선택값과 상태 업데이트 흐름

## 의도

Radix 기반 select를 화면별로 직접 사용하지 않고 `AppSelect`를 통해 통일한다. 이후 시스템/관리자 화면의 select류 UI를 동일한 시각 톤으로 확장하기 위한 준비 작업이다.
