---
title: WAFL A-TYPE DB Schema Policy
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---

# 16. DB Schema / Reset / Seed 정책

## 1. 목적

개발 중 DB schema 변경, full reset, smoke test, seed SQL의 기준을 정의한다.

현재 프로젝트는 아직 운영 전 단계이므로 schema 정리가 가능하다. 단, 정리 기준은 문서화하고 full reset 영향을 함께 확인한다.

## 2. SQL 파일 분류

```txt
db/schema/full_reset.sql
- 개발 DB를 현재 기준 schema로 재생성하는 기준 파일

db/schema/full_reset_smoke_test.sql
- full_reset 후 최소 동작 조건을 검증하는 SQL

db/migrations/*
- 기존 DB를 유지한 채 특정 patch 변경을 반영할 때 사용하는 SQL

db/seed/*
- 필수 bootstrap 또는 로컬 개발용 seed
```

## 3. full_reset.sql 기준

```txt
- 현재 코드가 실제로 사용하는 table/column만 포함한다.
- legacy/mock/demo 전용 schema는 제거한다.
- old compatibility를 위해서만 남은 column은 삭제 후보로 분류한다.
- R2 legacy path 유지를 위한 schema는 새로 추가하지 않는다.
```

## 4. full_reset_smoke_test.sql 기준

확인해야 하는 것:

```txt
- 핵심 테이블 존재
- 필수 enum/check constraint 존재
- 필수 index 존재
- permission catalog 기본값 존재
- system admin bootstrap 후 접근 가능한 구조인지
- invitation link-only 정책과 constraint 일치 여부
```

확인하지 않아도 되는 것:

```txt
- 실제 운영 고객사 데이터 존재 여부
- 대량 seed 데이터 존재 여부
- demo/mock 데이터 존재 여부
```

## 5. seed SQL 정책

```txt
system baseline seed:
- 권한 catalog, 기본 plan, system 기준값

system admin bootstrap seed:
- 특정 이메일을 system admin으로 등록하는 로컬/초기 세팅용 SQL

local dev sample seed:
- 화면 테스트용 고객사/작업지시서/첨부 dummy 데이터
- 운영 기준 파일과 분리한다.
```

## 6. migration 보관/삭제 기준

```txt
보관:
- 기존 DB를 유지한 채 적용할 가능성이 있는 최신 migration
- 아직 full_reset에 반영되지 않은 migration

삭제 가능:
- full_reset에 이미 반영된 과거 patch migration
- seed/demo/mock 목적으로만 존재한 patch SQL
- 현재 schema와 충돌하는 구버전 SQL
```

## 7. 사용하지 않는 table/column 정리 절차

```txt
1. information_schema로 현재 table/column 목록 확인
2. 코드 전체 검색으로 repository/API 사용 여부 확인
3. full_reset 기준 포함 여부 확인
4. 유지 / 삭제 / 보류로 분류
5. 삭제 시 full_reset과 smoke_test를 함께 수정
6. 필요하면 migration을 별도 제공
```

## 8. 금지

```txt
- 사용자 표시용 긴 문장을 DB 상태값으로 저장
- delete_reason 같은 column에 도메인 로직을 의존
- mock/fallback 데이터가 실제 조회에 섞이는 구조
- full_reset과 migration이 서로 다른 schema를 만들도록 방치
```

## 9. QA

```txt
[ ] full_reset 후 smoke_test가 통과하는가?
[ ] APP_VERSION 기준 문서와 SQL 변경 이력이 맞는가?
[ ] seed 없이도 empty state가 정상 표시되는가?
[ ] local dev sample seed가 운영 baseline과 분리되어 있는가?
```
