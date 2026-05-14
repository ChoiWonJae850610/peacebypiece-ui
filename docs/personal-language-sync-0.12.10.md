# 0.12.10 개인 설정 언어 다중 탭 동기화 보정

## 목적

테마는 localStorage 변경과 provider 동기화로 다른 탭에서도 즉시 반영되고 있었다. 언어 설정은 기존 i18n provider가 초기 로딩 또는 현재 탭 변경 중심으로 동작해, 다른 탭에서 변경한 언어가 새로고침 전까지 반영되지 않을 수 있었다.

## 변경 기준

- `I18nProvider`가 `peacebypiece.personal.settings` storage 변경을 감지한다.
- `PERSONAL_SETTINGS_CHANGE_EVENT`를 감지해 같은 탭에서 변경된 언어를 즉시 반영한다.
- legacy key인 `peacebypiece.admin.locale`도 fallback으로 유지한다.
- `document.documentElement.lang`도 동기화한다.

## 확인 항목

1. 탭 A와 탭 B를 동시에 연다.
2. 탭 A에서 `/me/settings` 언어를 영어로 변경한다.
3. 탭 B를 새로고침하지 않고 주요 문구가 영어로 바뀌는지 확인한다.
4. 탭 A에서 다시 한국어로 변경한다.
5. 탭 B가 새로고침 없이 한국어로 바뀌는지 확인한다.

## 보류

- DB 기반 사용자별 언어 저장은 로그인/사용자 설정 저장 구조 도입 후 처리한다.
- 서버 렌더링 시점의 사용자별 언어 결정도 인증 도입 이후 별도 설계한다.
