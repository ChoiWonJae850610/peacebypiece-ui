# 초대 수락 화면 API 연결

Version: 0.9.109

## 목적

`/invite/[token]` 초대 수락 화면을 skeleton에서 API 연결 화면으로 전환한다.

## 이번 패치 기준

1. `/invite/[token]` route 구조는 유지한다.
2. `InviteAcceptSkeleton`에서 `GET /api/invitations/accept?token=...`을 호출해 초대 상태를 조회한다.
3. ready / invalid / expired / revoked / accepted 상태를 화면에 표시한다.
4. ready 상태에서 `POST /api/invitations/accept`를 호출해 invitation status를 accepted로 변경한다.
5. raw token은 화면에서 마스킹해서만 표시한다.
6. 실제 회원가입, 로그인, user 생성은 포함하지 않는다.
7. invitation repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `components/invitations/InviteAcceptSkeleton.tsx`
- `lib/invitations/invitationAcceptanceSkeleton.ts`

## 제외

- 실제 회원가입
- 로그인
- user 생성
- company_user 생성
- role/permission 부여
- invitation DB schema 변경
- package.json 변경

## 다음 작업

0.9.110에서 `/system/companies` 고객사 관리 read-only 화면 추가를 진행한다.
