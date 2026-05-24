---
title: WAFL A-TYPE Release Test Policy
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---

# 19. 패치 / 릴리즈 / 테스트 정책

## 1. 목적

ChatGPT patch 적용, 로컬 build, DB reset, smoke test, 수동 QA의 기준을 정의한다.

## 2. patch 산출물 기준

```txt
- patch zip은 flat 구조로 제공한다.
- zip 최상위에 commit-meta.md와 __ 경로 변환 파일이 바로 있어야 한다.
- commit-meta.md의 Version과 APP_VERSION은 일치해야 한다.
- commit-meta.md의 파일 목록과 실제 제공 파일 목록은 일치해야 한다.
```

## 3. commit-meta.md label

```txt
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

콜론 앞 공백을 유지한다.

## 4. 적용 전 확인

```txt
1. repo-state의 APP_VERSION 확인
2. repo status clean 확인
3. patch target version 확인
4. package.json/package-lock 변경 여부 확인
5. DB schema 변경 여부 확인
6. 삭제 파일 목록 확인
```

## 5. build 정책

```txt
- ChatGPT/container에서는 npm run build를 실행하지 않는다.
- 사용자가 로컬에서 npm run build를 실행한다.
- 실패 시 build log를 다음 패치에 첨부한다.
- build log 기준으로 type/lint/runtime 오류를 우선 수정한다.
```

## 6. DB 적용 기준

full reset이 필요한 경우:

```txt
- schema 구조가 크게 바뀜
- 개발 DB를 초기화해도 되는 테스트 단계
- full_reset.sql과 smoke_test를 같이 검증해야 함
```

migration만 필요한 경우:

```txt
- 기존 데이터 유지가 필요함
- constraint/index/column 일부만 변경함
- patch migration SQL이 제공됨
```

seed만 필요한 경우:

```txt
- system admin bootstrap
- baseline permission catalog 보정
- local dev sample data
```

## 7. 수동 테스트 최소 루트

```txt
1. /login
2. /system
3. /workspace
4. /workspace/members
5. /workspace/settings
6. /workspace/files
7. /workspace/stats
8. /worker
9. /invite/company/[token]
10. /invite/member/[token]
```

## 8. 실패 로그 관리

```txt
- build 실패 파일은 FAIL_*_build-버전-시간.txt로 보관
- repo-state는 patch 적용 후 함께 보관
- 다음 패치 요청 시 build log와 repo-state를 같이 첨부한다.
```

## 9. 금지

```txt
- build 실패 상태에서 unrelated 대규모 리팩토링 진행
- APP_VERSION과 patch zip version 불일치
- commit-meta.md 삭제 목록 누락
- .env.local, secrets, 실제 DB/R2 URL 포함
```

## 10. QA

```txt
[ ] patch zip flat 구조인가?
[ ] APP_VERSION이 증가했는가?
[ ] build 실패 로그가 있으면 우선 수정했는가?
[ ] SQL 변경 시 full_reset 영향이 문서화되었는가?
[ ] 삭제 파일은 commit-meta.md에 들어갔는가?
```
