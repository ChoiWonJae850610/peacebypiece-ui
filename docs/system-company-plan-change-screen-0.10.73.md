# 0.10.73 시스템관리자 고객별 요금제/용량 변경 화면

## 목적

`/system/billing`에서 고객사별 요금제, 저장공간 한도, 멤버 한도, 가격 override를 변경하기 위한 1차 화면 구조를 정리한다.

이번 버전은 실제 저장 API를 활성화하지 않는다. 시스템관리자가 어떤 값을 검토하고 저장해야 하는지, 어떤 검증이 필요한지를 화면과 공통 policy 데이터로 먼저 고정한다.

## 포함 범위

- 고객별 요금제 변경 preview 영역 추가
- 변경 전후 요금제, 저장공간, 멤버 수, 가격, 적용 시작일 표시
- 변경 입력 항목을 `lib/billing/companyPlanChangePolicy.ts`로 분리
- 저장공간 상한, 멤버 상한, 변경 권한, 감사 로그 검증 항목 정의
- 0.10.72 build error 수정

## build error 수정

0.10.72 build log에서 `app/api/admin/files/snapshot/route.ts`의 `resolveStorageQuotaFromCompanyFilePolicy()` 호출에 `AdminStoragePolicySettings`가 전달되어 타입 오류가 발생했다.

수정 기준:

- quota 계산에는 실제 `CompanyFilePolicySettings`인 `settings.filePolicy`를 전달한다.
- 고객관리자 저장소 화면의 정책 표시에는 기존 `normalizeAdminFilePolicySettings()` 결과를 유지한다.
- 이로써 저장소 정책 표시 구조와 quota 계산 구조를 분리한다.

## 설계 기준

### 1. plan master

기본 요금제는 `lib/billing/defaultPlans.ts`를 기준으로 한다.

### 2. 고객사별 assignment

향후 실제 저장 시 다음 구조와 연결한다.

- `company_plan_assignments.company_id`
- `company_plan_assignments.plan_id`
- `company_plan_assignments.status`
- `company_plan_assignments.starts_at`
- `company_plan_assignments.ends_at`

### 3. override 대상

초기 override 대상은 아래 세 가지로 제한한다.

- 저장공간 한도
- 멤버 한도
- 가격

기능 플래그는 고객사별로 직접 override하지 않고 plan 기준을 우선한다.

### 4. 검증 후보

- 저장공간이 plan max storage 이내인지 확인
- 멤버 수가 plan max members 이내인지 확인
- 시스템관리자 billing 권한 확인
- 변경 전후 값을 audit log로 기록

## 후속 작업

0.10.74에서는 고객관리자 요금제 화면을 실제 중앙 quota policy와 연결하고, 0.10.75 이후에는 요금제 변경 API 또는 audit log 연결을 검토한다.
