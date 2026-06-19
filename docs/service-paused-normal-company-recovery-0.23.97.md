# 0.23.97 정상 회사 service-paused 복귀 보완

## 원인

`/dev/test-console`에서 승인 대기 또는 거절 회사를 확인한 뒤 정상 회사로 전환해도 현재 URL이 `/service-paused`이면 차단 화면에 그대로 남았습니다. 정상 회사는 `workspaceBlockedReason = null`이므로 화면에서는 `unknown` 상태로 표시됐습니다.

## 수정

- 로그인 세션과 회사 접근 상태가 존재하고 차단 사유가 없으면 `/service-paused`에서 `/workspace`로 즉시 복귀합니다.
- 승인 대기, 거절, 구독 차단 상태는 기존 안내 화면을 유지합니다.
- Seed 및 회사 접근 정책은 변경하지 않습니다.
