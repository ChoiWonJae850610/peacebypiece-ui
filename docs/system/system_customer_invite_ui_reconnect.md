# 시스템 고객 초대 UI 본 화면 재연결

Version: 0.9.104

## 목적

0.9.94에서 회귀 점검 화면으로 대체된 `/system/invites`를 시스템관리자 고객 초대 UI 본 화면으로 재연결한다.

## 이번 패치 기준

1. `/system/invites` route를 `SystemCustomerInviteSkeleton`으로 다시 연결한다.
2. `SystemCustomerInviteSkeleton`을 회귀 점검 placeholder에서 실제 초대 링크 생성 UI로 복원한다.
3. 기존 `createInvitationLink()` client helper를 사용한다.
4. 기존 `POST /api/invitations` API를 호출한다.
5. 시스템관리자 초대는 `system_to_company_admin` scope, `admin` role, `company_admin` preset을 사용한다.
6. 생성된 `inviteUrl`을 화면과 QR preview 영역에 표시한다.
7. 이메일 발송, 고객사 생성 자동화, 인증/회원가입, 초대 수락 후 user 생성은 포함하지 않는다.
8. invitation repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/system/invites/page.tsx`
- `components/system/invitations/SystemCustomerInviteSkeleton.tsx`
- `lib/system/systemCustomerInviteSkeleton.ts`
- `lib/system/systemRegressionRoutes.ts`

## 추가 범위

- `docs/system/system_customer_invite_ui_reconnect.md`

## 제외

- 이메일 발송
- 고객사 생성 자동화
- 회원가입
- 로그인
- 초대 수락 후 user 생성
- system user permission 확장
- package.json 변경
- DB schema 변경

## 다음 작업

0.9.105에서 `/system/billing` 요금제·용량 UI 본 화면 재연결을 진행한다.
