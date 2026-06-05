# 0.19.11 APP_VERSION 분리 및 app.ts 상수 복구

## 목적

0.19.10 패치에서 `lib/constants/app.ts`가 `APP_VERSION`만 남는 형태로 축소되면서 기존 전역 상수 export가 사라졌다. 이로 인해 `SECTION_PREFERENCES_STORAGE_KEY`, `WORKORDER_REPOSITORY_MODE` 등 기존 import가 build 단계에서 실패했다.

이번 패치는 버전 상수와 앱 전역 상수의 책임을 분리한다.

## 변경 기준

- `lib/constants/version.ts`를 추가한다.
- `APP_VERSION`은 `version.ts`에서만 직접 선언한다.
- `lib/constants/app.ts`는 `APP_VERSION`을 re-export하고, 기존 앱 전역 상수를 그대로 유지한다.
- 기존 import 경로 `@/lib/constants/app`는 깨지지 않게 유지한다.

## 유지해야 하는 app.ts export

- `APP_VERSION`
- `STORAGE_KEY`
- `LEGACY_STORAGE_KEYS`
- `SECTION_PREFERENCES_STORAGE_KEY`
- `WORKORDER_REPOSITORY_MODE`
- `PARTNER_REPOSITORY_MODE`
- `ATTACHMENT_MEMO_REPOSITORY_MODE`

## 이후 버전 갱신 규칙

이후 패치에서 버전만 올릴 때는 `lib/constants/version.ts`의 `APP_VERSION`만 수정한다. `lib/constants/app.ts`는 새 앱 전역 상수를 추가하거나 기존 상수를 의도적으로 변경해야 하는 경우가 아니면 수정하지 않는다.

## 기능 영향

DB/API/R2/첨부/메모/휴지통/purge/권한/상태 흐름은 변경하지 않는다. 이번 변경은 build 오류 복구와 버전 상수 분리만 포함한다.
