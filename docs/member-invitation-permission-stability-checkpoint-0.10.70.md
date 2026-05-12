# 0.10.70 멤버/초대/권한 1차 안정화 체크포인트

## 목적

0.10.52부터 0.10.69까지 진행한 초대, 가입 신청, 승인 대기, 권한 카탈로그, 권한 기반 카드 제한, API 권한 검증 준비, 고객사 초대/승인, 자동 이메일 발송 검토 흐름을 한 번에 점검한다.

이번 버전은 신규 저장 동작을 만들지 않는다. 화면, 정책, 링크, 다음 실제 연결 범위를 정리하는 안정화 체크포인트다.

## 추가 화면

- `/system/access-checkpoint`

## 점검 범위

### 고객관리자 내부 멤버 초대

- `/admin/members`
- `/invite/member/preview-company-member-token`
- 멤버관리 IA
- 멤버 초대 링크/QR preview
- 멤버 가입 신청 화면

### 시스템관리자 고객사 초대

- `/system/invites`
- `/invite/company/preview-system-company-token`
- `/system/companies`
- 고객사 초대 링크/QR preview
- 고객사 가입 신청 화면
- 고객사 승인/회사 생성 화면

### 권한과 접근 제한

- permission_code 기준 권한 카탈로그
- role template은 기본 체크값 또는 표시용
- 관리자 카드 노출 제한 preview
- API 권한 검증 1차 guard

### 승인 대기와 초기 기준정보

- `/pending`
- 승인 전 접근 제한
- 고객사 생성 후 초기 기준정보 복사 repository
- 자동 이메일 발송은 후순위 유지

## 다음 실제 연결 후보

1. Google OAuth/session 연결
2. join_requests 조회와 승인/거절 API 연결
3. companies 생성과 company_members/member_permissions 저장 연결
4. preview permission context 제거 후 session 기반 권한 조회로 전환
5. 주요 API의 requireApiPermission 적용 범위 확대

## 이번 버전에서 하지 않은 것

- 실제 Google OAuth 연결
- 초대 token_hash DB 조회
- join_requests 실제 저장
- 승인/거절 실제 DB 저장
- 자동 이메일 발송 provider 연동
- SMS/카카오 알림톡 발송
- R2 흐름 변경
