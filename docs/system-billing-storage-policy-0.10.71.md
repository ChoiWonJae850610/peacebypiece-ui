# 0.10.71 시스템관리자 요금제·용량 관리 설계

## 목표

시스템관리자가 고객사별 요금제, 저장공간 한도, 멤버 한도, 가격 예외 정책을 관리할 수 있도록 `/system/billing` 화면의 기준을 정리한다.

이번 버전은 실제 결제 자동화가 아니라 운영 정책 설계와 화면 반영을 목표로 한다.

## 설계 원칙

1. 요금제 기본값은 `lib/billing/defaultPlans.ts`를 기준으로 한다.
2. 고객사별 현재 요금제는 `company_plan_assignments` 개념으로 관리한다.
3. 고객사별 예외값은 기본 요금제를 복사하지 않고 override로 관리한다.
4. override 대상은 저장공간 한도, 멤버 한도, 가격으로 제한한다.
5. 고객관리자 화면은 읽기 전용으로 현재 요금제와 한도만 보여준다.
6. 시스템관리자 화면에서만 요금제와 override를 변경한다.
7. 저장공간 사용량은 초기에는 DB attachment metadata snapshot 기준으로 계산한다.
8. R2 inventory 기반 정밀 집계는 후속 단계로 분리한다.

## 이번 버전 반영 내용

- `/system/billing`의 문구를 skeleton에서 설계 화면 기준으로 보정했다.
- 요금제 카드가 `DEFAULT_PLAN_DEFINITIONS`를 기준으로 표시되도록 정리했다.
- 고객사 샘플 목록이 `resolveCompanyPlanPolicy()` 결과를 기준으로 한도와 override 출처를 보여주도록 정리했다.
- 저장공간 사용률 위험 라벨을 추가했다.
  - 85% 이상: 주의
  - 한도 초과: 초과
- 요금제·용량 관리 설계 기준 섹션을 추가했다.

## 아직 하지 않은 것

- 실제 `company_plan_assignments` DB CRUD
- 실제 고객사 목록 조회
- 실제 저장공간 snapshot 조회
- 저장공간 초과 시 업로드 차단
- 자동 결제 연동
- 청구서/영수증 발행
- 이메일/SMS 결제 알림

## 후속 작업 후보

### 0.10.72 — 저장소 용량 기준 중앙화

`/admin/files`와 `/system/storage-usage`가 같은 quota 정책을 사용하도록 `resolveCompanyPlanPolicy()` 기반 quota 계산을 중앙화한다.

### 0.10.73 — 시스템관리자 고객별 요금제/용량 변경 화면

시스템관리자가 고객사를 선택하고 plan, storage override, member override, price override를 저장할 수 있게 한다.

### 0.10.74 — 고객관리자 요금제 화면 실제 데이터 연결

고객관리자가 자신의 요금제와 저장공간 한도를 읽기 전용으로 확인할 수 있게 한다.
