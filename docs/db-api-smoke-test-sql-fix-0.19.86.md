# DB/API smoke test SQL 문법 오류 수정 1차 (0.19.86)

## 목적

0.19.85에서 추가한 `scripts/smoke-db-api.mjs`가 DB 기본 schema 검증은 통과했지만,
회사 계정 요청 검토 계약 점검 구간에서 SQL alias 문법 오류로 중단되는 문제를 수정한다.

## 원인

`system_user`를 SQL alias로 사용하면서 PostgreSQL 파서가 일부 환경에서 이를 예약어/특수 식별자처럼 처리하여
`system_user.name` 참조 시 `syntax error at or near "."` 오류가 발생할 수 있었다.

## 수정 내용

- `system_user` alias를 `reviewer_user`로 변경
- 회사 계정 요청 검토 fixture 생성 단계의 안내 로그를 추가
- 정책 동의 fixture 생성 단계의 안내 로그를 추가
- 앱 기능, DB schema, API route는 변경하지 않았다.

## 확인 방법

```powershell
npm run build
npm run test:smoke:db-api
```

## 기대 결과

- schema contract 통과
- company account request review contract 통과
- policy agreement contract 통과
- 마지막에 `Completed successfully. No test data was persisted.` 표시
