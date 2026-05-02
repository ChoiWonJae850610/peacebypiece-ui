# 초대 UI와 invitation API 연결

Version: 0.9.81

## 연결 대상

- `/system/invites`
- `/admin/invites`
- `/api/invitations`

## 이번 패치 기준

1. 시스템관리자 고객 초대 화면에서 `POST /api/invitations`를 호출한다.
2. 고객관리자 멤버 초대 화면에서 `POST /api/invitations`를 호출한다.
3. 초대 링크 생성 결과의 `inviteUrl`을 화면과 QR preview 영역에 표시한다.
4. raw token은 API 응답에서 한 번만 반환되며 화면에는 inviteUrl 중심으로 표시한다.
5. 이메일 발송, DB 저장, 초대 수락 페이지는 아직 연결하지 않는다.
6. 외부 QR 라이브러리는 추가하지 않는다.

## 다음 작업

0.9.82에서 invitation DB repository 연결 준비를 진행한다.
