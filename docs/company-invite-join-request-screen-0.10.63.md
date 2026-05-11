# 0.10.63 고객사 가입 신청 화면

## 목표

시스템관리자가 생성한 고객사 초대 링크 또는 QR로 접속했을 때 열리는 `/invite/company/[token]` 화면을 추가한다.

## 적용 범위

- `/invite/company/[token]` route 추가
- 고객사 가입 신청 화면 추가
- 고객사 초대 token preview 추가
- 고객사 신청 입력 항목과 승인 정책을 presentation 데이터로 분리
- invitation index export 추가
- APP_VERSION을 0.10.63으로 갱신

## 화면 정책

고객사 초대는 시스템관리자가 신규 고객사 담당자에게 공유하는 링크다.
초대 링크 접속만으로 고객사와 멤버십을 만들지 않는다.
신청자는 Google 로그인 후 가입 신청을 남기고, 시스템관리자가 승인할 때 다음 항목을 확정한다.

- companies 생성
- company_members에 고객관리자 후보 연결
- member_permissions에 고객관리자 권한 직접 부여
- 고객사 요금제와 저장공간 한도 확정
- 초기 기준정보 복사 연결

## 저장 정책

이번 버전에서는 실제 저장을 연결하지 않는다.
후속 버전에서 다음 흐름을 연결한다.

1. URL raw token 수신
2. 서버에서 token_hash 계산
3. invitations에서 invitation_type=system_to_company_admin 또는 scope=system_to_company_admin 검증
4. active / expired / cancelled 상태 검증
5. Google 로그인 이메일 검증
6. join_requests에 request_type=company 기준 저장
7. 승인 대기 화면 또는 시스템관리자 승인 대기 목록으로 연결

## 보안 기준

- raw token은 DB에 저장하지 않는다.
- DB에는 token_hash만 저장한다.
- 초대 이메일과 Google 로그인 이메일 일치 검증은 후속 인증 연결에서 처리한다.
- 승인 전에는 companies, company_members, member_permissions를 생성하지 않는다.
- role은 표시/기본 권한 묶음이며 실제 접근 제어는 permission_code 기준이다.

## 후속 작업

다음 버전은 시스템관리자 고객사 승인/회사 생성 흐름으로 이어간다.
