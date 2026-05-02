# 멤버 초대 UI 본 화면 재연결

Version: 0.9.102

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin/invites`를 고객관리자 멤버 초대 UI 본 화면으로 재연결한다.

## 이번 패치 기준

1. `/admin/invites` route를 `CompanyMemberInviteSkeleton`으로 다시 연결한다.
2. 기존 `createInvitationLink()` client helper를 사용한다.
3. 기존 `POST /api/invitations` API를 호출한다.
4. 고객관리자 멤버 초대 대상은 디자이너, 검수담당자, 재고담당자, 조회자로 제한한다.
5. 생성된 `inviteUrl`을 화면과 QR preview 영역에 표시한다.
6. 이메일 발송, 회원가입/인증, 초대 수락 후 user 생성은 포함하지 않는다.
7. invitation repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/admin/invites/page.tsx`
- `lib/admin/adminRegressionRoutes.ts`

## 재사용 범위

- `components/admin/invitations/CompanyMemberInviteSkeleton.tsx`
- `components/invitations/InvitationQrPreview.tsx`
- `lib/admin/companyMemberInviteSkeleton.ts`
- `lib/invitations/invitationClient.ts`
- `lib/invitations/invitationQrPreview.ts`

## 제외

- 이메일 발송
- 회원가입
- 로그인
- 초대 수락 후 user 생성
- role/permission 저장 확장
- package.json 변경
- DB schema 변경

## 다음 작업

0.9.103에서 `/system/category-rules` 카테고리 규칙 화면 read-only 복원을 진행한다.
