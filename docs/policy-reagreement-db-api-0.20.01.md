# 정책 재동의 필요 상태 DB/API 1차 0.20.01

## 1. 목적

중요 정책 변경으로 인해 사용자가 다시 동의해야 하는 정책 목록을 서버 기준으로 조회하고, 재동의 완료 기록을 저장하는 1차 DB/API 계약을 추가한다.

이번 버전은 기존 `policy_versions.requires_reagreement`와 `policy_agreements` 구조를 활용한다. 새 테이블은 추가하지 않는다.

## 2. 재동의 필요 판정 기준

재동의 필요 정책은 다음 조건을 모두 만족한다.

- `policy_documents.is_customer_visible = true`
- `policy_versions.is_current = true`
- `policy_versions.is_required_for_approval = true`
- `policy_versions.requires_reagreement = true`
- 현재 사용자의 `policy_agreements`에 해당 `policy_version_id` 동의 기록이 없음

조회 응답은 재동의 대상 전체와 동의/미동의 카운트를 함께 반환한다.

## 3. 추가 API

### GET /api/policies/reagreement

현재 세션의 `companyId`, `userId` 기준으로 재동의 필요 정책 상태를 조회한다.

응답 구조:

```json
{
  "ok": true,
  "status": {
    "documents": [],
    "requiredReagreementCount": 0,
    "agreedReagreementCount": 0,
    "pendingReagreementCount": 0,
    "hasPendingReagreement": false
  }
}
```

세션이 없거나 회사/사용자 식별이 불가능하면 `POLICY_SESSION_REQUIRED`를 반환한다.

### POST /api/policies/reagreement

현재 활성 필수 정책 중 `requires_reagreement = true`인 정책 버전에 대해 동의 기록을 저장한다.

- `agreement_scope`: `user`
- `agreement_source`: `workspace_reagreement`
- `ip_address`: `x-forwarded-for` 첫 번째 값
- `user_agent`: 요청 헤더의 `user-agent`

저장 후 동일한 재동의 상태 응답을 반환한다.

## 4. repository 기준

`lib/policies/policyAgreementRepository.ts`에 다음 함수를 추가한다.

- `listRequiredPolicyReagreementStatus`
- `agreeToRequiredPolicyReagreements`

기존 `listCurrentPolicyAgreementStatus`, `agreeToCurrentRequiredPolicies` 흐름은 유지한다.

## 5. schema 영향

이번 버전에서는 DB schema 변경이 없다.

- `policy_versions.requires_reagreement` 기존 필드 사용
- `policy_agreements` 기존 고유 조건 사용
- `full_reset.sql` 변경 없음
- 신규 migration 없음

## 6. 자동테스트 기준

`npm run test:smoke:db-api`의 정책 동의 contract에 재동의 검증을 추가한다.

검증 항목:

- `requires_reagreement = true`인 활성 필수 정책이 재동의 필요 목록에 잡히는지 확인
- 아직 동의하지 않은 경우 pending으로 잡히는지 확인
- `policy_agreements` 저장 후 pending 목록에서 제외되는지 확인
- smoke fixture는 transaction rollback 안에서만 생성되어 데이터가 남지 않음

## 7. 후속 작업

0.20.02에서는 `/workspace/legal`에서 재동의 필요 상태를 표시하고, 재동의 제출 UI를 연결한다.

0.20.03에서는 업무 화면 진입 전 재동의 필요 상태를 확인해 정책 미동의 업무 접근 차단을 적용한다.
