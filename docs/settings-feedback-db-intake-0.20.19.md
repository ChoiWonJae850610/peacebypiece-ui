# 0.20.19 환경설정 서비스 건의 DB 접수형 전환

## 목적

환경설정의 서비스 건의 화면을 임시 이메일 작성 방식에서 제품형 문의 접수 방식으로 전환한다.
고객사 관리자는 문의 유형, 제목, 내용을 입력하고 `문의하기` 버튼으로 접수하며, 접수 이력에서 최근 처리 상태를 확인한다.

## 변경 기준

- 이메일 주소를 고객 화면에 노출하지 않는다.
- `이메일 작성하기` 문구를 제거하고 `문의하기`로 통일한다.
- 접수 데이터는 `company_feedback_requests`에 저장한다.
- 고객사 범위는 현재 로그인 세션의 companyId를 사용한다.
- 접수 이력은 최근 5건만 표시한다.
- 시스템관리자 답변/상태 변경 UI는 후속 버전으로 분리한다.

## DB 구조

`company_feedback_requests`

- `feedback_type`: `feature`, `bug`, `improvement`
- `feedback_status`: `received`, `reviewing`, `answered`, `closed`
- `title`: 2~160자
- `message`: 10~2000자
- `source`: 기본값 `admin_settings`

## API

- `GET /api/admin/settings/feedback`
  - 현재 고객사의 최근 문의 5건 조회
- `POST /api/admin/settings/feedback`
  - 문의 접수
  - 접수 성공 시 `feedback_status = received`

## UI

- 좌측: 문의 유형, 제목, 내용 입력 폼
- 우측: 최근 접수 이력
- 접수 성공 시 토스트 표시
- 이메일 주소/메일 작성 링크는 표시하지 않는다.

## 후속 작업

- 시스템관리자 문의 목록/상세 화면
- 답변 작성 및 상태 변경
- 첨부 파일 접수
- 접수 알림
