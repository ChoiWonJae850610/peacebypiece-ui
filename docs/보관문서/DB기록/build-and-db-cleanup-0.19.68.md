# 0.19.68 빌드 오류 및 DB 테스트 스크립트 정리

## 목적

0.19.67에서 추가된 멤버 생애주기 상태가 빌드와 테스트용 SQL에 주는 영향을 정리했다.

## 빌드 오류 수정

`AdminMemberManagementDashboard.tsx`에서 `MemberDirectoryStatus` 타입을 반환 타입으로 사용했지만 import하지 않아 TypeScript 빌드가 실패했다.

이번 버전에서는 `AdminMemberDirectoryTableColumns`에서 이미 export 중인 `MemberDirectoryStatus` 타입을 함께 type import하도록 보정했다.

## 테스트 seed 영향 보정

`db/test/scenario_seed.sql`에 `withdrawal_requested`, `withdrawn` 상태를 확인할 수 있는 테스트 멤버 데이터를 추가했다.

`db/test/scenario_google_login_seed.sql`은 실제 Gmail 로그인 테스트 계정을 항상 `approved` 상태로 되돌리는 목적이 있으므로, 멤버 생애주기 컬럼을 함께 초기화하도록 보정했다. 또한 표시명 갱신은 승인 멤버만 대상으로 제한해 탈퇴 요청/탈퇴 완료 테스트 레코드를 덮어쓰지 않도록 했다.

## DB 파일 정리

`materials_schema_draft.sql`의 material/material-order 구조는 이미 `db/schema/full_reset.sql`에 반영되어 있어 제거했다.

`db/migrations`의 기존 패치 SQL들은 현재 `full_reset.sql` 기준선에 반영된 항목이므로 제거했다. 현재 개발 단계에서는 full reset 기준으로 DB를 맞추는 흐름을 우선한다.

## 변경하지 않은 것

- 실제 멤버 탈퇴/비활성 UI 버튼은 추가하지 않았다.
- 멤버 상태 변경 API의 기능 범위는 0.19.67 기준을 유지했다.
- package.json/package-lock.json은 변경하지 않았다.
