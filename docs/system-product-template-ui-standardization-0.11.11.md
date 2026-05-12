# 0.11.11 시스템 생산품 유형 템플릿 화면 공통 UI 적용

## 목적

시스템관리자 기준정보 영역 중 생산품 유형 기본 템플릿 화면과 고객사 초기 기준정보 복사 설계 화면에 남아 있던 개별 버튼/링크/상태 라벨 구현을 관리자 공통 UI 컴포넌트 기준으로 정리한다.

## 변경 범위

- `components/system/standards/SystemProductTemplateStandardsPage.tsx`
- `components/system/standards/SystemCustomerOnboardingTemplateDesignPage.tsx`
- `lib/constants/app.ts`

## 반영 내용

- 헤더 버전 라벨을 `AdminStatusBadge`로 전환
- 헤더 이동 링크를 `AdminLinkButton`으로 전환
- 생산품 유형 템플릿 상태 라벨을 `AdminStatusBadge`로 전환
- 템플릿 기본값/개수 라벨을 `AdminStatusBadge`로 전환
- 새로고침, 템플릿 추가, 저장, 취소, 수정, 사용/미사용, 분류 추가 버튼을 `AdminButton`으로 전환
- 템플릿이 없을 때 `AdminEmptyState`를 표시하도록 보강
- 고객사 초기 기준정보 복사 설계 단계 라벨을 `AdminStatusBadge`로 전환

## 변경하지 않은 것

- 생산품 유형 템플릿 CRUD API
- 카테고리 tree 저장 로직
- 고객사 초기 기준정보 복사 정책
- DB schema
- package.json / package-lock.json

## 확인 항목

- `/system/standards/product-templates`
- `/system/standards/customer-onboarding`
- 템플릿 추가 / 수정 / 사용 상태 변경
- 1차/2차/3차 분류 추가
- 분류명 수정 / 사용 상태 변경
