# WAFL A-TYPE 57 — DB domain status constants 1차

## 버전

0.15.34

## 목표

DB에 저장되는 status 계열 문자열을 화면과 기능 코드에서 직접 비교하는 패턴을 줄이고, 1차 공통 domain constants를 만든다.

이번 단계는 schema 변경 없이 TypeScript 계층의 기준값을 정리한다.

## 추가 기준 파일

- `lib/domain/companyStatus.ts`

## 포함한 domain 값

### 회사 온보딩 상태

- `profile_required`
- `approval_pending`
- `active`
- `rejected`

### 고객사 구독 상태

- `trialing`
- `trial_expired`
- `active`
- `past_due`
- `canceled`

### 가입 신청 상태

- `pending`
- `approved`
- `rejected`
- `cancelled`

### 초대 상태

- `draft`
- `pending`
- `active`
- `accepted`
- `expired`
- `revoked`
- `cancelled`

## 적용 범위

### 시스템 고객사 승인 presentation

- `components/system/companies/SystemCompanyApprovalConsole.tsx`에서 분리된 presentation helper 기준으로 status 비교를 상수 기반으로 보정했다.
- 고객사 온보딩 상태, 가입 신청 상태, 구독 제한 상태, 초대 상태 판정의 직접 문자열 비교를 줄였다.

### 고객사 온보딩 repository

- `companies.onboarding_status` 정규화 기준을 domain helper로 이동했다.
- 초대 링크의 허용 상태 판정에서 직접 문자열 비교를 상수 기반으로 바꿨다.

### 고객사 관리자 계정 정보 presentation

- 회사 온보딩 상태와 구독 상태 label 판정을 domain constants 기반으로 바꿨다.

## 이번에 의도적으로 하지 않은 것

- DB schema 변경 없음
- check constraint 변경 없음
- enum type migration 없음
- SQL literal 전체 치환 없음
- 기존 API 응답 포맷 변경 없음
- 권한/세션 흐름 변경 없음

## 남은 후보

### SQL literal 정리

아래는 SQL query 안에서 쓰이는 DB literal이므로 schema/check constraint와 함께 별도 단계에서 정리한다.

- `status = 'approved'`
- `status IN ('pending', 'active', 'accepted')`
- `onboarding_status = 'approval_pending'`
- `subscription_status = 'past_due'`

### 멤버 상태

- `company_members.status`
- `approved`
- `pending`
- `rejected`
- `suspended`

멤버 상태는 멤버관리 리팩토링 단계에서 별도 domain constants로 분리한다.

### 작업지시서 상태

- `draft`
- `review_requested`
- `review_completed`
- `rejected`
- 발주/생산/완료 계열 상태

작업지시서 상태는 자재 발주 flow와 직접 연결되므로 별도 단계에서 정리한다.

### 삭제/purge 상태

- `active`
- `trash`
- `purge_requested`
- `purged`

저장소/휴지통/purge 흐름은 현재 정상 동작 중이므로 별도 안전화 패치에서만 다룬다.

## 다음 작업

0.15.35 권장:

- member/workorder/storage status constants 후보를 더 넓게 조사
- SQL literal은 바로 치환하지 않고 DB check constraint와 full_reset.sql 영향까지 같이 확인
- TSX 안의 status 비교를 presentation/domain helper로 계속 이동
