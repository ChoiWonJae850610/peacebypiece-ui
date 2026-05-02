# 관리자 화면 기존 기능 회귀 점검

Version: 0.9.93

## 목적

최근 `/admin` 하위 route에서 GitHub raw 기준 깨진 JSX가 반복 확인되어, 관리자 화면의 build/runtime 차단을 막는 안정화 허브를 먼저 적용한다.

## 확인된 문제

GitHub raw 기준 아래 파일들이 `return ( );`, `return ;`, 또는 JSX가 마크다운처럼 손상된 형태로 조회된다.

- `app/admin/page.tsx`
- `app/admin/partners/page.tsx`
- `app/admin/files/page.tsx`
- `app/admin/history/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/invites/page.tsx`
- `components/admin/invitations/CompanyMemberInviteSkeleton.tsx`
- `components/admin/files/FileListSection.tsx`
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/FileStorageSummary.tsx`
- `components/admin/history/AdminWorkOrderHistoryPage.tsx`

## 이번 패치 기준

1. `/admin` 하위 route가 깨진 JSX로 build/runtime을 막지 않도록 안정화한다.
2. 기존 API, DB repository, 저장/삭제/표시 흐름은 수정하지 않는다.
3. 기능성 하위 컴포넌트를 무리하게 재연결하지 않는다.
4. route별 안전한 회귀 점검 화면을 먼저 제공한다.
5. 각 기능의 본 화면 복원은 별도 버전에서 하위 컴포넌트 단위로 진행한다.

## 안정화 route

- `/admin`
- `/admin/partners`
- `/admin/files`
- `/admin/history`
- `/admin/settings`
- `/admin/invites`

## 후속 권장 작업

0.9.94에서 시스템관리자 화면 회귀 점검을 진행한다.

그 다음 관리자 기능 복원은 아래 순서가 적절하다.

1. 파일 관리 하위 컴포넌트 복원
2. 히스토리 하위 컴포넌트 복원
3. 거래처/공장관리 하위 컴포넌트 복원
4. 설정 form 하위 컴포넌트 복원
5. 멤버 초대 UI 재연결
