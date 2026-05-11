# 0.10.56 고객관리자 내부 멤버 초대 링크/QR 생성 화면

## 목표

고객관리자 `/admin/members`에서 내부 멤버 초대 흐름을 화면 단위로 먼저 확정한다. 실제 token 생성, DB 저장, QR 라이브러리 연결, 링크 복사 기능은 후속 API 연결 단계에서 활성화한다.

## 적용 범위

- `/admin` 메인 운영 대시보드 하단의 기준정보 모음 제거
  - 단위표준, 외주공정, 생산품유형은 환경설정 내부 기준정보 화면으로 이동한 상태이므로 메인 대시보드에는 중복 노출하지 않는다.
- `/admin/members` 초대 링크/QR 생성 화면 추가
  - 초대 대상 이름
  - 이메일 또는 휴대폰 선택 입력
  - 기본 권한 묶음 선택
  - 초대 만료일 선택
  - 초대 링크 미리보기
  - QR 미리보기
  - 링크 복사/초대 생성 버튼 비활성 상태 표시

## 설계 기준

1. 이메일/SMS 자동 발송은 이번 단계에서 제외한다.
2. 고객관리자는 링크/QR을 생성하고 직접 카톡, 문자, 이메일 등으로 전달하는 방향을 1차 기준으로 둔다.
3. 실제 접근 제어는 role enum이 아니라 `permission_code` 직접 부여 기준을 유지한다.
4. role template은 기본 체크값으로만 사용한다.
5. 초대 생성 API가 연결되기 전까지는 preview token만 화면에 표시한다.
6. QR은 실제 QR 라이브러리 연결 전까지 화면 배치 확인용 placeholder로 표시한다.

## 후속 연결 기준

0.10.57 이후 실제 초대 API를 연결할 때 필요한 항목:

- `invitations` insert
- token 원문 미저장, `token_hash` 저장
- 초대 유형 `member_invitation`
- 만료일 저장
- 기본 role template 또는 permission preset 저장 방식 확정
- `/invite/member/[token]` 경로 연결
- join request 생성
- 승인 대기 대시보드 redirect

## 비적용 범위

- Google OAuth 실제 연결 없음
- invitation API 없음
- join request API 없음
- 실제 QR 생성 라이브러리 없음
- 실제 clipboard 복사 없음
- DB schema 변경 없음
- R2/저장소/휴지통/purge 흐름 변경 없음
