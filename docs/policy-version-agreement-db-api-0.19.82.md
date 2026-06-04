# 0.19.82 정책 버전/동의 이력 DB·API 1차

## 목적

고객 공개 정책 문서를 화면 전용 상수에만 두지 않고, 후속 고객사 승인 요청과 재동의 기능에서 사용할 수 있도록 정책 버전과 사용자 동의 이력 저장 구조를 추가한다.

## 추가 DB 구조

### policy_documents

고객 공개 정책 문서의 고정 식별자를 저장한다.

- `document_key`: 코드와 DB를 연결하는 안정 키
- `title`: 문서명
- `category`: service / privacy / billing / data / operation
- `is_customer_visible`: 고객 공개 여부

### policy_versions

정책 문서별 버전을 저장한다.

- `policy_document_id`
- `version_label`
- `effective_date`
- `effective_date_label`
- `is_current`
- `is_required_for_approval`
- `requires_reagreement`
- `content_snapshot`

초기 1차에서는 `CUSTOMER_POLICY_DOCUMENTS`를 기준으로 현재 버전을 upsert한다.

### policy_agreements

사용자별 정책 동의 이력을 저장한다.

- `policy_version_id`
- `company_id`
- `user_id`
- `agreement_scope`
- `agreement_source`
- `ip_address`
- `user_agent`
- `agreed_at`

동일 사용자가 동일 정책 버전에 중복 동의하지 않도록 `policy_version_id + user_id` unique 제약을 둔다.

## 추가 API

### GET /api/policies/current

현재 로그인 사용자의 정책 동의 상태를 조회한다.

반환 기준:

- 현재 공개 정책 문서
- 현재 버전
- 필수 동의 여부
- 동의 완료 여부
- 필수 동의 완료 건수

### POST /api/policies/agreements

현재 로그인 사용자가 현재 필수 정책 전체에 동의한다.

저장 기준:

- 현재 버전 필수 동의 정책만 저장
- 이미 동의한 정책 버전은 `agreed_at`을 최신화
- source는 `workspace_legal`
- IP/User-Agent는 요청 헤더 기준으로 저장

## 이번 버전에서 하지 않은 것

- 고객사 승인 요청 전 강제 동의 차단
- 로그인 후 재동의 모달
- 시스템관리자 정책 편집 화면
- 정책 전문 DB 편집 기능
- 이메일 고지/재동의 알림

## 테스트 기준

1. migration 적용 후 `policy_documents`, `policy_versions`, `policy_agreements` 테이블 생성 확인
2. `GET /api/policies/current` 호출 시 정책 문서 5건 기준 상태 반환 확인
3. `POST /api/policies/agreements` 호출 시 필수 동의 4건 저장 확인
4. 동일 사용자가 다시 동의해도 중복 row가 생기지 않는지 확인
5. `full_reset_smoke_test.sql`에서 정책 테이블/컬럼 누락 오류가 없는지 확인
