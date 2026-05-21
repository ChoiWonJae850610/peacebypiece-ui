---
title: DB 저장값 / JSON payload 감사
version: 0.15.33
baseline_source: peacebypiece-ui-0.15.32
status: audit
updated: 2026-05-21
---

# 56. DB 저장값 / JSON payload 감사

## 1. 목적

0.15.33에서는 결제, 원단/부자재 발주, DeviceKind, 모바일 대응을 본격 구현하기 전에 DB에 저장되는 값과 API payload 처리 방식이 제품 운영 기준에 맞는지 1차 감사한다.

핵심 기준은 아래와 같다.

```txt
- DB에는 사용자 화면 문장을 status/reason 값으로 저장하지 않는다.
- 상태값은 code/status enum 또는 check constraint 기준으로 저장한다.
- raw request body 전체를 장기 저장하지 않는다.
- jsonb metadata는 감사로그/스냅샷처럼 목적이 명확한 곳에만 제한적으로 사용한다.
- raw token, 전체 카드번호, CVC, 카드 비밀번호, 주민등록번호, 카드 유효기간 원문은 저장하지 않는다.
- UI label과 DB domain value를 분리한다.
```

## 2. 이번 버전에서 함께 수정한 빌드 오류

0.15.32 빌드 로그 기준 오류는 `SystemCompanyApprovalConsole.tsx`에서 `isPdfOnboardingFile`을 사용하지만 import 목록에 포함하지 않아 발생했다.

```txt
Cannot find name 'isPdfOnboardingFile'.
```

조치:

```txt
components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/system/systemCompanyApprovalPresentation.ts에서 이미 export 중인 isPdfOnboardingFile을 import 목록에 추가
```

이 수정은 화면 동작 변경 없이 타입 오류만 해소한다.

## 3. DB schema 1차 감사 결과

### 3.1 양호한 항목

```txt
invitations
- raw token은 저장하지 않고 token_hash만 저장하는 설계가 명시되어 있다.
- full_reset.sql 주석에도 raw token 미저장 원칙이 적혀 있다.

company_onboarding_files
- 파일 원본명, mimeType, size, storage_key 등 파일 metadata가 구조화되어 있다.
- 원본 파일 자체나 base64 payload를 DB에 저장하는 구조가 아니다.

member_permissions
- permission_code 기반 권한 부여 테이블로 분리되어 있다.
- role template은 기본값이고 실제 접근 제어는 permission_code를 기준으로 확장할 수 있다.

spec_sheets / memos / attachment_trash_items
- delete_status, purge_status는 check constraint가 있다.
- delete_source, delete_scope, delete_parent_type처럼 삭제 맥락이 구조화되어 있다.
```

### 3.2 주의 항목

```txt
companies.onboarding_status
companies.subscription_status
spec_sheets.status
orders.status
material_orders.status
users.status
company_members.status
join_requests.status
```

현재 여러 status가 `text + check constraint` 형태로 존재한다. 개발 중에는 허용 가능하지만, TypeScript domain type과 DB check constraint가 어긋나지 않도록 상수화가 필요하다.

권장:

```txt
- lib/domain/* 또는 lib/*/domainTypes.ts에 status union과 allowed values를 둔다.
- DB check constraint 값과 TS allowed values를 문서상 1:1로 유지한다.
- UI label은 presentation/i18n에서만 만든다.
```

### 3.3 jsonb / metadata 항목

확인된 주요 jsonb 항목:

```txt
system_audit_logs.metadata jsonb
company_account_requests.request_payload jsonb
storage_usage_snapshots 등 일부 snapshot/summary 계열 metadata
```

판단:

```txt
system_audit_logs.metadata
- 허용 가능.
- 단, 개인정보/secret/raw token/전체 request body 저장 금지.
- 변경 전후 값 전체 저장보다 targetId, actionCode, resultCode, reasonCode 중심으로 저장한다.

company_account_requests.request_payload
- 주의 필요.
- 계정 변경 요청은 구조화된 컬럼으로 분리하는 편이 안전하다.
- request_payload가 raw body dump로 사용되면 안 된다.

snapshot/summary metadata
- 허용 가능.
- 단, 통계 재계산에 필요한 최소 구조만 저장한다.
```

## 4. repository / API 1차 감사 결과

### 4.1 raw token

```txt
lib/invitations/invitationRepository.ts
- createInvitationTokenHash(rawToken)로 hash 생성
- findInvitationByRawToken(rawToken)는 입력 raw token을 받아 hash 비교용으로 쓰는 구조
```

판단:

```txt
- raw token을 DB에 저장하지 않는 방향은 적절하다.
- response나 log에 raw token을 장기 노출하지 않도록 유지해야 한다.
- 초대 링크 생성 직후 사용자에게 보여주는 URL은 허용하되 audit log에는 hash 또는 invitationId만 남긴다.
```

### 4.2 join request rejection reason

```txt
join_requests.rejection_reason
- system_admin_rejected
- customer_admin_rejected
```

판단:

```txt
- 현재는 code 형태로 저장되어 비교적 안전하다.
- 장기적으로 rejection_reason은 rejection_reason_code로 이름을 명확히 하는 것이 좋다.
- 사용자 표시 문구는 i18n/presentation에서 변환한다.
```

### 4.3 approval error message

```txt
lib/invitations/joinRequestRepository.ts
- COMPANY_APPROVAL_STEP_FAILED:${stage}:...
```

판단:

```txt
- 내부 오류 코드로는 사용 가능하다.
- 사용자 화면에 그대로 표시하면 안 된다.
- API 응답에서는 stage/detail을 최소화하고 presentation에서 사용자용 문구로 변환한다.
```

### 4.4 workorders/status route

```txt
app/api/workorders/status/route.ts
- PAYLOAD_COLUMN_CANDIDATES = payload, data, workorder_payload, work_order_payload
```

판단:

```txt
- legacy schema 호환 탐색으로 보인다.
- 신규 schema에서는 raw payload 저장 컬럼을 유지하지 않는 방향이 낫다.
- 0.15.x 이후 schema reset 허용 기준에서는 legacy payload 후보 제거를 검토할 수 있다.
```

## 5. 우선 정리 대상

### 5.1 high priority

```txt
1. company_account_requests.request_payload
- raw payload dump로 쓰이는지 확인 필요
- 계정 변경 요청 유형별 컬럼 또는 typed detail 구조로 분리 권장

2. app/api/workorders/status/route.ts legacy payload column candidates
- 현재 schema에서 실제 사용 여부 확인 필요
- 사용하지 않으면 제거 후보

3. status text + check constraint와 TS union 불일치 가능성
- status values를 domain constants/types로 묶는 작업 필요
```

### 5.2 medium priority

```txt
1. memo / override_memo / request_memo
- 사용자 입력 메모는 허용
- 시스템 reason/status 대체 용도로 사용하면 안 됨

2. rejection_reason
- code 형태는 유지 가능
- 컬럼명을 reason_code 성격으로 명확히 정리하는 것은 추후 schema reset 때 검토

3. system_audit_logs.metadata
- audit metadata 허용
- 민감정보와 raw request body 저장 금지 규칙 필요
```

### 5.3 low priority

```txt
1. storage_usage snapshot memo
- 운영 메모 성격이면 유지 가능
- 통계 계산에 필요한 값은 별도 컬럼 우선

2. material_orders.memo
- 발주 담당자 업무 메모로 유지 가능
- 상태/reason code 대체 용도로 사용 금지
```

## 6. 다음 리팩토링 권장 순서

```txt
0.15.34 — DB domain status constants 1차
- company/member/joinRequest/invitation/subscription status 상수화
- DB check constraint 값과 TS union 기준 문서화

0.15.35 — legacy payload route 정리 검토
- app/api/workorders/status/route.ts 사용 여부 확인
- 사용 중이면 typed status response로 축소
- 미사용이면 제거 후보 문서화 후 삭제

0.15.36 — audit metadata policy
- system_audit_logs.metadata 허용 key 기준 정리
- raw body, secret, token, 카드정보 저장 금지 규칙 코드/문서 반영

0.15.37 — account request schema 정리 설계
- company_account_requests.request_payload 대체 구조 설계
- full_reset.sql 반영 여부 결정
```

## 7. 이번 버전에서 하지 않은 것

```txt
- DB schema 변경 없음
- full_reset.sql 변경 없음
- API 응답 포맷 변경 없음
- R2 저장/삭제 흐름 변경 없음
- 결제/증빙 데이터 모델 구현 없음
- raw payload 후보 제거 없음
```
