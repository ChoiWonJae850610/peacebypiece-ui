# 0.9.212 — 통계 API 캐싱 정책과 TanStack Query 도입 판단

## 목표

0.9.212는 통계 화면의 캐싱 기준을 먼저 고정하고, TanStack Query 도입 여부를 판단하는 버전이다.
이번 버전에서는 `package.json`과 `package-lock.json`을 수정하지 않는다.

## 판단

현재 고객관리자 통계 화면은 서버 컴포넌트에서 `getAdminStatsSnapshot`을 호출하고, 클라이언트 컴포넌트는 이미 계산된 snapshot을 표시한다.
따라서 지금 단계에서 TanStack Query를 즉시 도입하면 이점보다 구조 변경 비용이 더 크다.

결론:

- TanStack Query 도입은 보류
- 통계 화면 캐싱 정책은 코드 상수로 문서화
- 통계 API route가 분리되는 시점에 제한 도입
- 전역 fetch 구조는 변경하지 않음

## 캐싱 기준

| 범위 | 기준 | stale 기준 | 무효화 기준 |
|---|---:|---:|---|
| 서버 통계 overview | 서버 집계 | 60초 | 기간/회사/작업지시서 상태 변경 |
| 클라이언트 통계 화면 | API route 분리 후 적용 | 120초 | period, companyId, feature gate 변경 |
| 통계 내보내기 | 캐시하지 않음 | 0초 | 요청마다 재계산 |

## TanStack Query 도입 조건

아래 조건이 충족되면 도입한다.

1. `/api/admin/stats/*` route가 실제 화면 데이터 소스로 분리된다.
2. 기간 필터 변경 시 클라이언트에서 즉시 재조회해야 한다.
3. 회사/요금제/feature gate가 query key에 포함된다.
4. 화면 단위 staleTime과 refetch 정책이 필요해진다.
5. package 변경을 명시 허용하는 작업 버전으로 진행한다.

## 이번 버전 변경 범위

- `lib/admin/stats/cachePolicy.ts` 추가
- `lib/admin/stats/index.ts` export 추가
- `/admin/dashboard`에 캐싱 정책 안내 카드 추가
- 중복 표시되던 협력업체 분포 제목 1개 제거
- `APP_VERSION` 0.9.212 반영

## SQL DDL 필요 여부

불필요.

## 전체 리셋 필요 여부

불필요.

## package 변경 여부

불필요.

이번 버전에서는 `@tanstack/react-query`를 설치하지 않는다.

## 테스트 케이스

1. `APP_VERSION`이 0.9.212인지 확인한다.
2. `/admin/dashboard`에서 통계 API 캐싱 기준 카드가 표시되는지 확인한다.
3. TanStack Query 상태가 보류로 표시되는지 확인한다.
4. 서버/클라이언트/export 캐싱 기준이 각각 표시되는지 확인한다.
5. 협력업체 분포 제목이 중복 표시되지 않는지 확인한다.
6. `package.json`과 `package-lock.json`이 변경되지 않았는지 확인한다.
7. `npm run build`를 실행한다.
