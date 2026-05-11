# 0.10.58 승인 대기 대시보드 설계

## 목적

초대 링크로 가입 신청을 완료했지만 아직 고객관리자 승인을 받지 않은 사용자가 접근할 수 있는 제한된 대시보드를 추가한다.

## 추가 경로

- `/pending`

## 승인 전 사용자 접근 정책

승인 전 사용자는 고객사 업무 데이터에 접근하지 못한다.
허용 범위는 아래 정도로 제한한다.

- 신청 상태 확인
- 개인 설정(`/me/settings`)
- 로그아웃
- 문의 또는 개발 건의 안내

차단 대상은 아래와 같다.

- 작업지시서
- 저장소
- 통계정보
- 협력업체 관리
- 멤버관리
- 환경설정의 조직 관리 기능

## 데이터 연결 기준

이번 버전은 화면과 정책 고정이 목적이며 실제 session, OAuth, join_requests 조회는 연결하지 않는다.
후속 API 연결 시 아래 순서로 판단한다.

1. session user 확인
2. join_requests에서 pending 신청 조회
3. company_members approved 여부 확인
4. pending이면 `/pending` 유지
5. approved이면 permission_code 기준으로 `/workspace` 또는 적절한 기본 화면으로 redirect

## 보안 기준

프론트에서 카드와 버튼을 숨기는 것은 UX 보조일 뿐이다.
업무 데이터 접근 차단은 API 권한 검증에서 반드시 처리해야 한다.

## 후속 연결 후보

- Google OAuth session 연결
- `join_requests.pending` 조회
- 승인 후 redirect 정책 연결
- 업무 route 접근 시 pending 사용자를 `/pending`으로 redirect
- 실제 로그아웃 버튼 연결
- 문의/개발 건의 링크 연결
