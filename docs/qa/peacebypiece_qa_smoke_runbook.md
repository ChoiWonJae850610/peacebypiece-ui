# PeaceByPiece QA Smoke Runbook

Version: 0.9.96

## 최소 QA 순서

1. patch 적용
2. 파일 목록 확인
3. APP_VERSION 확인
4. 금지 파일 확인
5. `npm run build`
6. route smoke
7. API smoke
8. commit
9. push
10. repo-state 생성

## PC 화면 smoke

### 작업지시서

```text
[ ] / 접속
[ ] 작업지시서 목록 표시
[ ] 작업지시서 상세 진입
[ ] 상태 버튼 렌더링
[ ] 첨부 영역 렌더링
```

### 관리자

```text
[ ] /admin 접속
[ ] /admin/partners 접속
[ ] /admin/files 접속
[ ] /admin/history 접속
[ ] /admin/settings 접속
[ ] /admin/invites 접속
```

### 시스템관리자

```text
[ ] /system 접속
[ ] /system/invites 접속
[ ] /system/billing 접속
[ ] /system/category-rules 접속
```

## API smoke

DB 연결 환경에서만 ok true를 기준으로 판단한다.

```text
[ ] /api/system/companies
[ ] /api/system/permissions
[ ] /api/system/billing
[ ] /api/system/stats
[ ] /api/system/storage-usage?companyId=company-sample-customer
[ ] /api/admin/stats?companyId=company-sample-customer
[ ] /api/invitations?companyId=company-sample-customer
```

## DB smoke

full reset을 한 DB라면:

```sql
\i db/schema/full_reset_smoke_test.sql
```

기대:

```text
full_reset smoke test passed
```

## 회귀 금지 영역

아래는 해당 버전 목표가 아니면 수정하지 않는다.

```text
- R2 업로드
- R2 삭제
- R2 표시
- 다운로드 redirect
- attachment DB metadata
- memo DB 저장
- workorder 상태 변경
- Partner DB 저장
- full_reset.sql
- package.json / package-lock.json
```

## 결과 기록

QA 후 다음을 기록한다.

```text
Version:
npm run build:
route smoke:
API smoke:
DB smoke:
문제:
다음 작업:
```
