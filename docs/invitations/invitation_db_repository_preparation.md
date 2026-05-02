# invitation DB repository 연결 준비

Version: 0.9.82

## 목적

0.9.81에서 초대 UI가 `POST /api/invitations`를 호출하도록 연결되었다.  
이번 버전은 실제 DB 저장으로 바로 전환하지 않고, repository 교체 지점을 먼저 분리한다.

## 이번 패치 기준

1. 기존 in-memory invitation repository 동작은 유지한다.
2. `createMemoryInvitationRepository`와 `createInvitationRepository`를 분리한다.
3. `INVITATION_REPOSITORY_MODE`를 추가해 향후 DB repository 전환 지점을 만든다.
4. `createDbInvitationRepositorySkeleton`을 추가하되 실제 DB query는 연결하지 않는다.
5. DB skeleton은 실수로 호출되면 명시적 not connected error를 던진다.
6. API 응답 포맷은 변경하지 않는다.
7. raw token은 여전히 생성 응답에서 한 번만 반환한다.

## 다음 작업

0.9.83에서 invitation DB 저장 연결을 진행한다.

대상:
- `invitations` 테이블 insert
- `token_hash` 저장
- raw token 미저장
- 초대 목록 조회
- pending duplicate 처리
