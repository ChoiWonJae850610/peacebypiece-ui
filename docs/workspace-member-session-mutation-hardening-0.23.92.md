# Workspace member session and mutation hardening — 0.23.92

## 목적

Workspace API가 서명된 세션의 `companyId`, `companyMemberId`, `userId` 조합을 현재 DB 멤버십과 다시 대조한 뒤 조회·수정 요청을 처리하도록 보강한다.

## 변경 사항

- 회사 전체 멤버 목록을 최대 200건 조회한 뒤 찾던 권한 검사를 제거했다.
- `(company_id, company_member_id)`로 멤버를 직접 단건 조회한다.
- 현재 로그인 `userId`와 멤버 레코드의 `user_id`가 일치해야 한다.
- 멤버 상태가 `approved`가 아니면 모든 workspace API 진입을 차단한다.
- 정지, 탈퇴 요청, 탈퇴, 거절, 대기 상태의 오래된 세션으로 조회나 mutation을 수행할 수 없다.
- 불일치 세션은 `WORKSPACE_MEMBER_SESSION_INVALID` 403 응답을 반환한다.
- company admin 세션 정책은 기존대로 유지한다.

## 효과

- 다른 사용자의 companyMemberId를 가진 비정상·오래된 세션의 권한 오인 방지
- 100명 초과 고객사에서도 목록 limit에 영향을 받지 않는 권한 검사
- 권한 변경·정지 직후 API 재요청 시 현재 DB 상태 반영
- tenant 범위를 회사 ID와 멤버 ID 양쪽에서 제한
