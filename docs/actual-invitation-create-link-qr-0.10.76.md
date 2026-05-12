# 0.10.76 초대 생성 API와 초대 링크 실제 저장 연결 1차

## 목표

초대/가입/승인 화면 preview 단계에서 실제 초대 생성 1차 테스트가 가능한 단계로 전환한다.

## 반영 내용

- `/admin/members` 멤버 초대 생성 버튼 활성화
- `/system/invites` 고객사 초대 생성 버튼 활성화
- `POST /api/invitations`를 호출해 raw token 생성
- DB에는 `token_hash`만 저장
- 생성 응답에서 raw token과 inviteUrl을 한 번만 반환
- API 응답의 invitation 객체에서는 `tokenHash`를 제거
- 생성된 inviteUrl을 클립보드로 복사 가능하게 연결
- 시스템관리자 고객사 초대는 승인 전 회사가 없을 수 있으므로 `company_id` NULL 허용 보강 SQL 추가

## 테스트 가능한 범위

### 고객관리자 내부 멤버 초대

1. `/admin/members` 진입
2. 초대 대상 이메일 입력
3. 기본 권한 묶음 선택
4. 초대 생성 클릭
5. 생성된 `/invite/member/{rawToken}` 링크 확인
6. 링크 복사 확인
7. `audit_logs`에 `invitation.created` 기록 확인

### 시스템관리자 고객사 초대

1. `/system/invites` 진입
2. 담당자 이메일 입력
3. 초대 링크 생성 클릭
4. 생성된 `/invite/company/{rawToken}` 링크 확인
5. 링크 복사 확인
6. `audit_logs`에 `invitation.created` 기록 확인

## 아직 제외된 범위

- token_hash 기반 초대 링크 검증
- `/invite/member/[token]`에서 실제 invitation 조회
- `/invite/company/[token]`에서 실제 invitation 조회
- 가입 신청 저장
- join_requests 실제 생성
- 승인 대기 대시보드 실제 조회
- 고객관리자 승인 저장
- 시스템관리자 고객사 승인 저장

## 보안 기준

- raw token은 DB에 저장하지 않는다.
- raw token은 초대 생성 응답에서만 반환한다.
- 감사 로그 metadata에는 raw token을 저장하지 않는다.
- 초대 링크 복사는 클라이언트 clipboard API로만 처리한다.
