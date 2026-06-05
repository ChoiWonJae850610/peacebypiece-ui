# 0.17.99 작업지시서 모달 Select 공통화

## 목적

작업지시서 기본정보/검수 모달에 남아 있던 native select를 WAFL 공통 `AppSelect`로 전환한다.

## 반영 범위

- `BasicInfoEditModal`
  - 대분류/품목/세부형태 선택을 `AppSelect`로 전환
  - 기존 category id/name 연동과 fallback 선택 흐름 유지
- `OrderInspectionModal`
  - 업체 선택을 `AppSelect`로 전환
  - 검수 대상 주문 선택을 `AppSelect`로 전환
  - 기존 입고 수량/재고 계산 및 적용 흐름 유지

## 비변경 범위

- 작업지시서 저장 흐름
- 검수 완료 처리 흐름
- 재고 수량 계산
- 첨부/메모/R2 흐름
- PC/tablet/mobile 레이아웃 구조

## 후속 후보

- `PartnerFactoryRegistryModal` 등 남은 native select 후보 점검
- 관리자/시스템관리자 화면의 role/status/category select 순차 전환
