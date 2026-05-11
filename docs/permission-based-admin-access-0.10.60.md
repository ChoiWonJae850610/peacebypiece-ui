# 0.10.60 권한 기반 메뉴/카드/버튼 제한 1차

## 목적

멤버 승인/초대 흐름에서 부여하는 `permission_code`를 고객관리자 화면 노출 기준으로 연결하기 위한 1차 구조를 추가한다.

이번 버전은 실제 로그인 세션과 API 권한 검증을 연결하지 않는다. 화면이 비어 보이거나 기존 관리자 진입이 막히지 않도록 현재 프론트 렌더링은 `company_admin` 기본 권한 묶음을 preview 권한으로 사용한다.

## 적용 범위

- `/admin` 운영 관리 카드 노출 기준을 `permission_code` 기반 필터 함수로 통과시킨다.
- `/admin/members`의 메인화면 카드 권한 영역에 각 카드의 필요 권한을 표시한다.
- `/admin/members`의 승인 처리 액션에 필요한 권한을 명시한다.
- 권한 판정 유틸을 `lib/permissions/permissionAccess.ts`로 분리한다.

## 현재 화면 노출 기준

| 화면/카드 | 필요 권한 |
| --- | --- |
| 작업지시서 업무 화면 | `workorder.read` |
| 협력업체 관리 | `partner.read` |
| 저장소 관리 | `storage.read` |
| 통계정보 | `stats.read` |
| 환경설정 | `settings.read` |
| 멤버 관리 | `member.read` |
| 기준정보 관련 후보 | `standards.manage` |

## 승인 처리 액션 권한

| 액션 | 필요 권한 |
| --- | --- |
| 승인 | `member.approve`, `member.permission.update` |
| 거절 | `member.reject` |
| 권한 수정 | `member.permission.update` |

## 후속 연결 기준

1. 실제 OAuth/session 연결 후 현재 사용자 `company_member`를 조회한다.
2. `member_permissions.permission_code` 목록을 가져온다.
3. 프론트 카드 노출은 `hasEveryMemberPermission` 결과로 제한한다.
4. 프론트 제한은 UX 보조일 뿐이며, API 권한 검증은 0.10.61 이후 `requirePermission` 계열 유틸로 별도 적용한다.
5. 버튼 숨김/비활성화와 API 차단은 같은 permission_code를 사용하되, API가 최종 보안 기준이다.

## 이번 버전에서 하지 않은 것

- 실제 로그인 세션 조회
- 실제 DB 권한 조회
- API route 권한 검증
- 멤버 승인/거절 저장
- 메뉴 접근 차단 redirect
