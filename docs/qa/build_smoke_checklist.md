# PeaceByPiece Build Smoke Checklist

Version: 0.9.96

## 목적

patch 적용 후 `npm run build`만 보고 끝내지 않고, route/API/DB/파일 구조까지 최소 기준으로 확인하기 위한 체크리스트다.

## 실행 전 기준 확인

patch 적용 전 아래 repo-state 조건을 확인한다.

```text
Patch Version = 직전 버전
Push Completed = true
Branch = master
Local HEAD Commit = Origin Master Commit
Status Short = clean
APP_VERSION = 직전 버전
```

## patch 적용 직후 확인

```text
[ ] 제공 파일 개수와 commit-meta.md 수정/추가/삭제 파일 목록이 일치한다.
[ ] lib/constants/app.ts APP_VERSION이 Target Version과 일치한다.
[ ] package.json이 수정되지 않았다.
[ ] package-lock.json이 수정되지 않았다.
[ ] .env.local이 포함되지 않았다.
[ ] 실제 secret, token, DB URL이 포함되지 않았다.
```

## build 확인

실행:

```bash
npm run build
```

통과 기준:

```text
[ ] TypeScript compile error 없음
[ ] Next.js route compile error 없음
[ ] import path error 없음
[ ] server-only/client boundary error 없음
[ ] dynamic route params type error 없음
```

## route smoke 확인

브라우저 또는 Vercel Preview에서 아래 route를 확인한다.

### 기본 업무

```text
[ ] /
[ ] /worker
```

### 고객관리자

```text
[ ] /admin
[ ] /admin/partners
[ ] /admin/files
[ ] /admin/history
[ ] /admin/settings
[ ] /admin/invites
```

### 시스템관리자

```text
[ ] /system
[ ] /system/invites
[ ] /system/billing
[ ] /system/category-rules
```

### 초대 수락

```text
[ ] /invite/test-token
```

## API smoke 확인

### system API

```text
[ ] /api/system/companies
[ ] /api/system/permissions
[ ] /api/system/billing
[ ] /api/system/stats
[ ] /api/system/storage-usage?companyId=company-sample-customer
```

### admin API

```text
[ ] /api/admin/stats?companyId=company-sample-customer
[ ] /api/invitations?companyId=company-sample-customer
```

### invitation API

```text
[ ] GET /api/invitations/accept?token=test-token
[ ] POST /api/invitations
[ ] POST /api/invitations/accept
```

## DB 연결 확인 기준

DB가 없는 환경에서는 API가 다음처럼 실패할 수 있다.

```text
DB_NOT_CONFIGURED
DB_CONNECTION_FAILED
```

이 경우 build 실패가 아니라 환경 설정 문제로 분류한다.

DB가 있는 환경에서는 아래를 확인한다.

```text
[ ] full_reset.sql 또는 patch SQL 적용 상태가 최신이다.
[ ] full_reset_smoke_test.sql이 통과한 DB인지 확인했다.
[ ] /api/system/companies가 ok: true를 반환한다.
[ ] /api/system/billing이 ok: true를 반환한다.
[ ] /api/system/stats가 ok: true를 반환한다.
```

## 실패 시 분류

### build 실패

우선순위:

1. syntax / JSX 손상
2. import path 오류
3. type export/import 불일치
4. server-only/client boundary 오류
5. Next.js route params 타입 오류

### runtime 실패

우선순위:

1. DB env 누락
2. table/view 누락
3. query column mismatch
4. API response shape mismatch
5. client component fetch 처리 오류

### 회귀 위험

아래 흐름은 목표 없이 수정하지 않는다.

```text
[ ] 첨부 업로드
[ ] 첨부 삭제
[ ] 첨부 표시
[ ] 첨부 다운로드
[ ] 메모 저장
[ ] 작업지시서 상태 변경
[ ] 거래처/공장관리 저장
```

## 다음 repo-state 생성

build와 smoke 확인 후 자동화 스크립트로 repo-state를 생성한다.

```text
C:\CWJ_Project\patch_result\repo-state-{version}-{yyyymmdd-hhmmss}.txt
```
