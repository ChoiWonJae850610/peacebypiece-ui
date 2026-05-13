# 0.11.26 남은 날짜 입력 UI 조사 및 1차 공통화 후보 확정

## 목적

0.11.24에서 추가한 `AdminDateRangePicker` 이후 관리자/시스템/작업지시서 화면에 남아 있는 직접 날짜 입력 UI를 다시 조사하고, 후속 공통화 범위를 안전하게 분리한다.

이번 버전은 빌드 오류 수정과 조사 문서화를 중심으로 한다. 작업지시서 저장 정책과 연결된 날짜 입력은 실제 UI 치환 대상에서 제외했다.

## 함께 수정한 빌드 오류

로컬 build log에서 `components/admin/dashboard/AdminStatsDashboard.tsx`가 `useEffect`를 사용하지만 React import에 포함하지 않아 TypeScript 오류가 발생했다.

수정 내용:

- `import { useMemo, useState } from "react";`
- `import { useEffect, useMemo, useState } from "react";`

기존 통계 화면 상태 전환, 카테고리 선택 보정, `AdminDateRangePicker` 동작은 변경하지 않았다.

## 조사 결과

### 1. 직접 date input 사용처

현재 확인된 직접 날짜 입력 UI는 아래 1곳이다.

- `components/workorder/detail/sections/OrderInfoSection.tsx`
  - `EditableValue`에 `inputType="date"` 전달
  - 실제 input 처리는 `components/workorder/detail/shared/detailEditorShared.tsx`의 `EditableValue` 내부에서 수행
  - 대상 필드: 발주/생산 행의 `dueDate`

판단:

- 작업지시서 상세의 납기일 입력은 저장 정책, 발주 요청 유효성, workflow 진행 조건과 연결되어 있다.
- 단순히 `AdminDateRangePicker`로 치환하면 query 기반 기간 선택 UI와 row 단위 저장 UI가 섞인다.
- 이번 관리자 UI 공통화 라인에서는 변경하지 않는다.

### 2. 이미 공통화된 관리자 기간 선택

- `components/admin/dashboard/AdminStatsDashboard.tsx`
- `components/admin/common/AdminDateRangePicker.tsx`
- `app/admin/dashboard/page.tsx`
- `lib/admin/stats/selectors.ts`
- `lib/admin/adminStats.repository.ts`

현재 구조:

- `/admin/dashboard?period=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` query string 유지
- `AdminDateRangePicker`에서 달력 선택만 담당
- 기간 검증과 fallback은 `lib/admin/stats/selectors.ts`가 담당
- DB 조회 조건은 repository 계층에서 처리

판단:

- 관리자 통계 기간 선택은 현재 공통화 완료 상태로 본다.
- query string 동작과 기존 API 호출 조건을 유지해야 하므로 이번 버전에서는 추가 변경하지 않는다.

### 3. 날짜 표시만 하는 영역

아래 영역은 날짜를 입력하지 않고 표시만 한다.

- 작업지시서 모바일/태블릿 주문 정보 표시
  - `components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx`
  - `components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx`
- 작업지시서 목록 카드
  - `components/workorder/list/WorkOrderListCard.tsx`
- 발주 요청 문서 미리보기/출력
  - `components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx`
  - `lib/workorder/presentation/orderRequestDocumentPrint.ts`

판단:

- Date picker 공통화 대상이 아니다.
- 추후 i18n/format display 정리 단계에서 별도 검토가 적합하다.

### 4. 시스템/관리자 감사 로그 날짜 필터

현재 조사 범위에서 관리자/시스템 화면에 별도의 `input[type="date"]` 기반 감사 로그 날짜 필터는 확인되지 않았다.

판단:

- 향후 `/system/audit-logs`에 기간 필터가 추가될 경우 `AdminDateRangePicker`를 재사용하는 것이 적합하다.
- 단, audit log는 통계와 달리 시간 단위 필터가 필요할 수 있으므로 `AdminDateRangePicker` 확장 여부를 별도 판단해야 한다.

## 1차 공통화 후보 확정

### 즉시 공통화 가능

현재 추가로 즉시 치환할 직접 날짜 입력 UI는 없다.

### 후속 설계 필요

- 작업지시서 상세 `dueDate` 편집
  - 단일 날짜 입력 전용 컴포넌트가 필요하다.
  - 후보 이름: `AdminSingleDatePicker`가 아니라 작업지시서 도메인에 맞춘 `WorkOrderDateInput` 또는 `WorkOrderDueDateEditor`가 적합하다.
  - 이유: 관리자 기간 선택 UI와 업무 저장 UI의 목적이 다르다.

### 보류 대상

- 작업지시서 발주/납기일 입력
- 작업지시서 발주 요청 유효성 검증과 연결된 날짜
- 생산구성/발주 후속 처리에서 새로 생길 자재 확인 날짜

## 다음 작업 권장

0.11.27에서는 예정대로 관리자 Table/List 잔여 패턴 조사를 진행한다.

날짜 입력은 현재 추가 공통화 후보가 작고, 작업지시서 핵심 저장 흐름과 연결되어 있어 UI 공통화 라인에서 무리하게 진행하지 않는 것이 안전하다.
