# package-lock 동기화 0.23.10

## 목적

`package.json`에 선언된 `date-fns` 의존성과 `package-lock.json` 루트 의존성 정보가 일치하지 않아 `npm ci`가 실패하던 상태를 정리합니다.

## 변경

- `package-lock.json`을 현재 `package.json` 기준으로 재생성했습니다.
- 루트 의존성에 `date-fns: ^4.4.0`이 반영됐습니다.
- 현재 의존성 그래프에서 사용되지 않는 오래된 잠금 항목을 정리했습니다.
- `package.json`의 의존성 선언은 변경하지 않았습니다.

## 검증 기준

- `npm ci`
- `npm run audit:wafl-ui`
- `npm run build`

## 비고

- DB Migration 없음
- 기능 소스 변경 없음
- `npm audit fix` 및 `npm audit fix --force` 미실행
