# 작업지시서 DB 드라이버 로딩 긴급 보정 (0.11.45.1)

## 목적

작업지시서 화면에서 `DB 드라이버 없음` 상태가 표시되고 실제 DB 데이터가 로딩되지 않는 문제를 우선 보정한다.

## 원인 판단

`lib/db/client.ts`가 `pg`를 `new Function("specifier", "return import(specifier);")` 방식으로 런타임 동적 import하고 있었다. 이 방식은 Next.js/Turbopack/Vercel 서버 번들링에서 `pg` dependency 사용을 정적으로 추적하지 못할 수 있다.

그 결과 `package.json`에 `pg`가 존재해도 서버 런타임에서 DB client를 만들 때 `DB_DRIVER_MISSING`으로 분류될 수 있다.

## 변경 내용

- `pg`의 `Pool`을 서버 전용 DB client 모듈에서 명시 import하도록 변경했다.
- `PgPoolLike` 어댑터 타입은 유지해 기존 `queryDb`, `withDbTransaction` 호출부를 변경하지 않았다.
- `pg` 타입 선언이 프로젝트에 없을 때 TypeScript가 실패하지 않도록 최소 module declaration을 추가했다.
- 작업지시서 저장, 상태 변경, 첨부, 메모, R2 흐름은 변경하지 않았다.

## 영향 범위

- `/api/workorders/status`
- `/api/workorders`
- 작업지시서 목록/상세 DB 조회 경로
- DB 공통 client 생성 경로

## 확인 항목

1. `npm run build`를 로컬에서 실행한다.
2. 작업지시서 화면에 진입한다.
3. 좌측 상단 상태가 `DB 드라이버 없음`에서 벗어나는지 확인한다.
4. 작업지시서 목록이 DB에서 로딩되는지 확인한다.
5. 작업지시서 상세 조회, 저장, 상태 변경이 기존처럼 동작하는지 확인한다.

## 비고

이번 버전은 긴급 보정 버전이므로 다음 정규 버전은 `0.11.46`으로 복귀한다.
