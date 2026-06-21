# DB/API smoke test 성공 기준 보정 2차 (0.19.87)

## 목적

0.19.86 기준에서 `npm run test:smoke:db-api`가 성공한 상태를 다음 자동 테스트 확장의 기준선으로 고정한다.
이번 단계는 앱 기능 로직을 바꾸지 않고, smoke test 실행 결과를 사람이 읽기 쉽게 보정하는 데 집중한다.

## 적용 기준

- 0.19.86에서 PostgreSQL SQL alias 문법 오류 수정 완료
- 사용자가 0.19.86 기준 `npm run test:smoke:db-api` 성공 확인
- 0.19.87은 성공 기준 문서화와 출력 메시지 보정만 수행

## 보정 내용

- smoke test 시작 시 테스트 이름, 사용 DB 환경변수명, rollback 안전장치를 표시한다.
- schema contract 결과를 테이블 단위로 명확히 표시한다.
- 실패 시 `schema contract`, `company account request review contract`, `policy agreement contract` 중 어느 영역인지 표시한다.
- 누락 테이블/컬럼, 회사 계정 요청 검토, 정책 동의 저장/조회 실패 시 다음 확인 위치를 함께 표시한다.
- 성공 시 통과 항목 수와 통과 항목 목록을 요약한다.
- rollback 결과를 `Persistence: no test data was persisted` 문구로 명확히 표시한다.

## 현재 smoke test 범위

1. schema contract
   - companies
   - users
   - system_users
   - company_account_requests
   - policy_documents
   - policy_versions
   - policy_agreements

2. company account request review contract
   - 고객사 fixture 생성
   - 고객사 관리자 fixture 생성
   - 시스템관리자 fixture 생성
   - 회사 계정 요청 승인 상태 저장
   - `reviewed_by_system_user_id` 기준 시스템관리자 join 확인
   - 승인 결과로 회사 비활성/구독 상태 변경 확인

3. policy agreement contract
   - 고객사/사용자 fixture 생성
   - 고객 공개 필수 정책 문서 fixture 생성
   - 현재 정책 버전 fixture 생성
   - 정책 동의 저장
   - 필수 정책 동의 count 조회 확인

## 실행 명령

```powershell
npm run test:smoke:db-api
```

## 기대 성공 결과

마지막 출력에 다음 의미의 결과가 표시되어야 한다.

```text
[smoke] Summary
  Passed checks: 9
  Result: completed successfully
  Persistence: no test data was persisted
```

## 다음 확장 후보

0.19.88에서 다음 항목을 smoke test에 추가한다.

- 멤버 상태 변경 검증
- 개인 탈퇴 요청 검증
- 회사 계정 요청 승인/반려 분기 검증
- 정책 동의 저장 검증 확장
- 모든 테스트 데이터 ROLLBACK 유지
