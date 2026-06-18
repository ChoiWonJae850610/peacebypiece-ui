# dev/test 콘솔 감사로그 target type 빌드 수정 — 0.23.79

## 원인

`/api/dev/test-context/switch`와 `/api/dev/test-context/clear`가 감사로그의 `targetType`에 `user`를 사용했지만, `SystemAuditTargetType`에는 `user`가 정의되어 있지 않아 Next.js TypeScript 빌드가 실패했다.

## 수정

두 이벤트는 계정·세션 컨텍스트 전환 기록이므로 허용 타입인 `auth`로 통일했다.

- `dev_test.context_switched` → `targetType: "auth"`
- `dev_test.context_cleared` → `targetType: "auth"`

세션 전환, production 차단, cookie overlay, audit metadata 동작은 변경하지 않았다.
