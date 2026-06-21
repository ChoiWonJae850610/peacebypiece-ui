# 요금제/저장공간 DB·API 1차 (0.20.05)

## 1. 목적

`0.20.05`는 `0.20.04`에서 정리한 요금제, 무료체험, 저장공간, 멤버 제한 운영 기준을 실제 DB/API 계약으로 연결하는 1차 구현 버전이다.

이번 버전은 결제 연동이 아니라 현재 고객사의 구독 상태와 사용 한도를 조회할 수 있는 기반을 만든다.

## 2. 포함 범위

포함한다.

- `company_subscriptions` 테이블 추가
- `company_subscriptions` migration 추가
- `full_reset.sql` 반영
- `full_reset_smoke_test.sql` 반영
- 현재 고객사 구독 상태 조회 repository 추가
- `GET /api/admin/subscription` 추가
- DB/API smoke test에 구독 계약 추가

포함하지 않는다.

- 실제 PG 연동
- 결제수단 저장
- 결제 실패 webhook
- 요금제 변경 요청 API
- 저장공간 업로드 제한
- 멤버 초대 제한
- 요금제 UI 연결

## 3. DB 구조

신규 테이블은 `company_subscriptions`다.

핵심 컬럼은 다음과 같다.

- `company_id`
- `plan_code`
- `status`
- `trial_started_at`
- `trial_ends_at`
- `current_period_started_at`
- `current_period_ends_at`
- `cancel_scheduled_at`
- `canceled_at`
- `storage_limit_bytes`
- `member_limit`

초기에는 회사당 하나의 구독 row를 둔다. 과거 구독 이력은 후속 단계에서 이력 테이블로 분리할 수 있다.

## 4. 요금제 코드

허용 값은 다음과 같다.

- `trial`
- `lite`
- `flow`
- `studio`
- `custom`

## 5. 상태 코드

허용 값은 다음과 같다.

- `trialing`
- `active`
- `past_due`
- `payment_failed`
- `cancel_scheduled`
- `canceled`
- `suspended`

기존 `companies.subscription_status`는 legacy mirror 성격으로 남아 있으므로 check constraint에 신규 상태를 함께 허용한다.

## 6. 조회 API

신규 API는 다음과 같다.

```txt
GET /api/admin/subscription
```

응답은 현재 로그인 사용자의 `companyId` 기준으로 조회한다.

응답 구조는 다음 정보를 포함한다.

- 현재 요금제 코드/라벨
- 구독 상태 코드/라벨
- 무료체험 시작/종료일
- 현재 결제 기간 시작/종료일
- 저장공간 한도
- 저장공간 사용량
- 저장공간 사용률
- 멤버 한도
- 활성 멤버 수
- 데이터 source

## 7. 사용량 1차 기준

저장공간 사용량은 1차로 다음 기준을 사용한다.

```txt
company_files에서 deleted_at IS NULL인 파일의 size_bytes 합계
```

작업지시서 첨부, 디자인 파일, 휴지통 파일 포함 여부, R2 inventory 기반 보정은 `0.20.07` 이후 저장소 사용량 제한 설계/구현 단계에서 확장한다.

## 8. 멤버 수 1차 기준

멤버 수는 1차로 다음 기준을 사용한다.

```txt
users에서 company_id가 같고 is_active = true이며 role <> 'system'인 사용자 수
```

초대 대기, 비활성 멤버, 탈퇴 요청 상태의 과금 포함 여부는 멤버 제한 UI/API 단계에서 별도 확정한다.

## 9. fallback 기준

`company_subscriptions` row가 아직 없는 회사는 기존 `companies`의 다음 값을 fallback으로 사용한다.

- `requested_plan_code`
- `subscription_status`
- `trial_started_at`
- `trial_ends_at`
- `storage_limit_bytes`
- `member_limit`

migration은 기존 회사에 대해 기본 구독 row를 자동 생성한다.

## 10. 자동테스트

`npm run test:smoke:db-api`에 다음 계약을 추가했다.

- `company_subscriptions` 필수 테이블/컬럼 존재
- trial subscription fixture 생성/조회
- active flow subscription fixture 생성/조회
- 저장공간 한도/사용량 조회
- 멤버 한도/활성 멤버 수 조회

## 11. 후속 작업

다음 단계는 `0.20.06` 요금제/저장공간 UI 1차다. 환경설정 화면에서 현재 요금제, 상태, 저장공간 사용량/한도, 멤버 수/한도를 실제 API로 표시한다.
