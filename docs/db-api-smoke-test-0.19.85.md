# DB/API smoke test 1차 — 0.19.85

## 목적

0.19.67 이후 추가된 멤버 생애주기, 회사 계정 요청 검토, 정책 버전/동의 이력 흐름은 수동 테스트만으로 확인하기 어렵다. 0.19.85에서는 앱 화면 기능을 바꾸지 않고 DB/API 계약을 검증하는 자동 smoke test 진입점을 추가한다.

## 추가 스크립트

```bash
npm run test:smoke:db-api
```

실행 전에는 개발 또는 초기화 가능한 테스트 DB URL을 현재 터미널 환경변수에 설정해야 한다.

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
npm run test:smoke:db-api
```

운영 DB에서는 실행하지 않는다.

## 검증 범위

- 필수 테이블 존재 여부
  - `companies`
  - `users`
  - `system_users`
  - `company_account_requests`
  - `policy_documents`
  - `policy_versions`
  - `policy_agreements`
- 필수 컬럼 존재 여부
- 회사 계정 요청 검토자 FK 구조
  - `reviewed_by_system_user_id`
  - `system_users` 조인
- 계정 비활성화 승인 결과 반영 계약
  - `companies.is_active = false`
  - `companies.subscription_status = 'canceled'`
- 정책 필수 동의 이력 저장 계약
  - 현재 정책 버전
  - 필수 정책 동의 row
  - 중복 저장 방지용 upsert 구조

## 데이터 보존 기준

스크립트는 `BEGIN` 후 테스트 데이터를 삽입하고 마지막에 항상 `ROLLBACK`한다. 정상 완료 시 테스트 데이터는 DB에 남지 않는다.

## 포함하지 않은 범위

- Next.js 서버 실행
- 브라우저 E2E 테스트
- Google 로그인 세션 생성
- R2 업로드/삭제
- PDF 생성
- 결제/이메일 발송

위 범위는 별도 버전에서 Playwright 또는 전용 테스트 헬퍼로 분리한다.

## 다음 단계

0.19.86 이후에는 seed 재정리와 API smoke test 범위를 확장한다.

- 회사 계정 요청 생성 API
- 시스템관리자 승인/반려 API
- 고객사 관리자 요청 이력 API
- 개인 프로필 탈퇴 요청 API
- 멤버 상태 변경 API
- 정책 현재 버전/동의 API
