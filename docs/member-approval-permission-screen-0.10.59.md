# 0.10.59 멤버 승인/권한 부여 화면 설계

## 목표
고객관리자 `/admin/members`에서 가입 신청자를 확인하고 승인 또는 거절하기 전에 권한을 직접 확인할 수 있는 1차 화면을 추가한다.

## 적용 범위
- 가입 신청/승인 대기 화면의 시각적 구조 보강
- 승인 처리 액션 영역 추가
- role template 기반 권한 체크리스트 표시
- 실제 저장 전제 문서화

## 정책
- role은 기본 권한 묶음으로만 사용한다.
- 실제 저장과 접근 제어는 `permission_code` 직접 부여 기준이다.
- 승인 시 `company_members`를 승인 상태로 만들고 `member_permissions`에 선택 권한을 저장한다.
- 거절 시 `join_requests`를 rejected 상태로 처리한다.
- 승인/거절/권한 수정 이벤트는 후속 audit log 연결 대상이다.

## 이번 버전에서 하지 않은 것
- 실제 `join_requests` DB 조회
- 실제 승인/거절 API 호출
- 실제 `member_permissions` 저장
- 실제 session/OAuth 연결
- API 권한 검증

## 후속 연결
- 0.10.60 권한 기반 메뉴/카드/버튼 제한 1차
- 0.10.61 API 권한 검증 1차
- audit log 연결은 0.10.75 이후 확장 후보
