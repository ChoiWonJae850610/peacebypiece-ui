# 0.10.7 멤버관리 1차 placeholder 화면

## 목적

고객관리자 카드형 홈에서 `멤버 관리` 카드가 실제 화면으로 이동할 수 있도록 `/admin/members` 1차 placeholder 화면을 추가한다.

이번 버전은 실제 멤버 초대, 권한 DB, 권한 편집 저장 기능을 구현하지 않는다. 후속 DB/초대 시스템으로 확장하기 전에 역할, 권한 카드, 권한 그룹 기준을 관리자 화면에서 확인할 수 있는 진입점을 만드는 단계다.

## 반영 내용

- `/admin/members` 라우트 추가
- 멤버관리 placeholder 컴포넌트 추가
- 역할 기본값 영역 추가
- 메인화면 카드 권한 후보 영역 추가
- 권한 그룹 요약 영역 추가
- 고객관리자 홈의 `멤버 관리` 카드를 `/admin/members`로 연결
- 멤버관리 화면의 topbar title/summary i18n 보정

## 보류 범위

- 실제 초대 링크 생성
- 이메일/QR 초대 발송
- `members`, `roles`, `permissions`, `role_permissions` DB schema
- 권한 변경 저장 API
- 실제 권한 기반 라우트 guard

## 후속 작업

1. 멤버 DB schema 설계
2. 초대 링크/QR 정책 설계
3. 멤버 목록/권한 편집 UI 구현
4. 권한 기반 카드 필터링 연결
5. API 권한 체크 연결
