# 0.9.22420 i18n glossary / domain terms 구조 도입

## 목표

admin/worker i18n 잔여 정리 과정에서 반복되는 도메인 용어를 문장별 key에 계속 복제하지 않도록 `terms` glossary namespace를 추가했다.

## 적용 원칙

- 반복 도메인 용어는 `lib/i18n/{locale}/terms.ts`에서 관리한다.
- 안내문, 경고문, 결과 메시지처럼 어순이 중요한 문장은 기존 namespace의 문장 key를 유지한다.
- 컴포넌트가 단순 용어 fallback을 직접 쓰는 경우 `terms.*` key를 우선 사용한다.
- 영어 locale에 한국어 fallback을 넣어 우회하지 않는다.
- DB 저장값이나 사용자 입력값은 자동 번역하지 않는다.

## 이번 버전 반영

- `termsKo`, `termsEn` 추가
- `I18N_RESOURCES`에 `terms` namespace 추가
- `useAdminTranslation()`에서 `terms.*` path를 읽을 수 있도록 보정
- 저장소 요약/휴지통/작업지시서 저장소 일부 반복 용어를 glossary 기준으로 전환
- 문장 key 전체를 단어 조립식으로 바꾸지는 않음

## 후속 기준

- 문장은 문장 key를 유지한다.
- 반복 도메인 명사는 `terms`를 사용한다.
- 상태값/DB code 변환은 presentation helper에서 처리한다.
- 컴포넌트 내부에서 `locale === "ko" ? ... : ...` 형태의 직접 분기를 만들지 않는다.
