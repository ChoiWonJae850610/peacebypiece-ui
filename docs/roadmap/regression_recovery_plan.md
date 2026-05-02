# PeaceByPiece 회귀 안정화 후 기능 복원 순서

Version: 0.9.97

## 목적

0.9.93과 0.9.94에서 `/admin`, `/system` 하위 route를 안전한 회귀 점검 화면으로 대체했다.  
0.9.95와 0.9.96에서는 SQL 운용 정책과 build smoke 기준을 정리했다.

이 문서는 0.9.97 이후 기능성 화면을 다시 복원할 때의 순서와 기준을 고정한다.

## 현재 기준

- repo-state 기준 APP_VERSION: 0.9.96
- `/admin` route 안정화 완료
- `/system` route 안정화 완료
- DB/API skeleton 및 일부 실제 DB 집계 연결 완료
- build smoke 체크리스트 문서화 완료

## 복원 원칙

1. 한 버전에서 하나의 기능 화면만 복원한다.
2. route 안정화 화면을 바로 제거하지 말고, 본 기능 컴포넌트가 build 통과한 뒤 교체한다.
3. 정상 동작 중인 API, DB repository, 첨부 업로드/삭제/표시 흐름은 목표 없이 수정하지 않는다.
4. JSX 손상 여부가 의심되는 컴포넌트는 먼저 작은 read-only 컴포넌트로 복원한다.
5. 저장/삭제/상태변경 같은 write action은 read-only 복원 후 별도 버전에서 붙인다.
6. `package.json`, `package-lock.json`, `.env.local`은 수정하지 않는다.

## 0.9.98 — 파일 관리 화면 read-only 복원

대상:
- `/admin/files`
- `components/admin/files/*`

목표:
- 파일/휴지통/저장공간 요약 화면을 read-only 기준으로 복원
- 기존 첨부 삭제/다운로드 API는 건드리지 않음
- 깨진 JSX 컴포넌트만 안정형으로 교체

제외:
- 실제 삭제 정책 변경
- R2 실시간 inventory 조회
- 업로드/삭제 flow 수정

## 0.9.99 — 히스토리 화면 read-only 복원

대상:
- `/admin/history`
- `components/admin/history/*`

목표:
- 작업지시서 히스토리/운영 변경 이력 화면을 read-only 기준으로 복원
- 기존 history repository/API가 있으면 조회만 연결
- 없으면 안전한 placeholder + API 경로 표시

제외:
- audit log DB 신규 설계
- 이벤트 write action 추가

## 0.9.100 — 거래처/공장관리 화면 read-only 복원

대상:
- `/admin/partners`
- `PartnerMasterSection`
- 거래처/공장관리 하위 컴포넌트

목표:
- 거래처 목록/필터/상태 표시를 read-only 기준으로 복원
- DB 저장 flow는 기존 정상 동작 확인 전까지 유지 또는 비활성
- 외주공정/파트너 item UI는 손상 컴포넌트 단위로 분리 복원

제외:
- partner schema 변경
- 저장 정책 변경
- 기존 저장 API 변경

## 0.9.101 — 환경설정 화면 read-only 복원

대상:
- `/admin/settings`

목표:
- 고객사 설정 화면의 표시 구조 복원
- 저장 버튼은 후속 버전에서 연결
- 설정 항목별로 UI와 데이터 출처를 문서화

제외:
- 실제 settings DB 저장
- 권한 정책 즉시 적용

## 0.9.102 — 멤버 초대 UI 본 화면 재연결

대상:
- `/admin/invites`
- `CompanyMemberInviteSkeleton`
- invitation API

목표:
- 0.9.81의 초대 UI/API 연결 상태를 다시 본 화면으로 복원
- 초대 링크 생성 결과 표시
- role/preset 선택 UI 복원

제외:
- 이메일 발송
- 회원가입/인증 연결
- 초대 수락 후 user 생성

## 0.9.103 — 시스템 카테고리 규칙 화면 복원

대상:
- `/system/category-rules`

목표:
- 카테고리 추천 규칙 관리 화면을 read-only 또는 제한적 edit 기준으로 복원
- 기존 rule 데이터 구조 확인
- rule 저장 action은 build 안정화 후 별도 점검

제외:
- AI 분류 기능
- 자동 카테고리 추천 고도화

## 0.9.104 — 시스템 고객 초대 UI 본 화면 재연결

대상:
- `/system/invites`
- `SystemCustomerInviteSkeleton`
- invitation API

목표:
- 시스템관리자 고객사 관리자 초대 UI 복원
- 초대 링크 생성 결과 표시
- QR preview 영역 복원

제외:
- 이메일 발송
- 고객사 생성 자동화
- 인증/회원가입 연결

## 0.9.105 — 시스템 요금제·용량 UI 본 화면 재연결

대상:
- `/system/billing`
- `/api/system/billing`

목표:
- 0.9.90에서 연결한 DB billing overview를 화면에 다시 표시
- plans, company_plan_assignments, storage usage snapshot 표시
- 저장 action은 아직 비활성 또는 별도 버전

제외:
- 결제 자동화
- 요금제 저장 action
- storage 초과 차단

## 0.9.106 — 시스템 통계 화면 read-only 연결

대상:
- `/system`
- `/api/system/stats`

목표:
- 시스템 통계 API 결과를 read-only card/list로 표시
- 차트 라이브러리 추가 없이 HTML/Tailwind로 표시
- 고객사 수, 저장공간, 초대 수락률 표시

제외:
- 차트 라이브러리 추가
- AI 통계 분류
- 매출/결제 통계

## 0.9.107 — 고객관리자 통계 화면 read-only 연결

대상:
- `/admin`
- `/api/admin/stats?companyId=company-sample-customer`

목표:
- 고객관리자 통계 API 결과를 read-only card/list로 표시
- 작업지시서 수, 상태별 수, 첨부 수, 저장공간, 완료율 표시

제외:
- 디자이너별/공장별/카테고리별 2차 통계
- 차트 라이브러리 추가

## 0.9.108 — 초대 수락 화면 API 연결

대상:
- `/invite/[token]`
- `/api/invitations/accept`

목표:
- 초대 token 상태 조회
- ready/invalid/expired/revoked/accepted 상태 표시
- 수락 버튼 skeleton 연결

제외:
- 실제 회원가입
- 로그인
- user 생성

## 0.9.109 — audit log 설계 문서화

목표:
- 시스템관리자/고객관리자 주요 변경 행위 기록 기준 정의
- audit_logs 테이블 초안
- route/action별 기록 대상 정리

제외:
- 실제 audit log write 연결

## 0.9.110 — audit log SQL 초안

목표:
- audit_logs SQL 추가
- full_reset과 patch SQL 정합성 적용
- smoke test 항목 추가

## 복원 중단 조건

아래 상황이면 기능 복원을 중단하고 빌드/무결성 수정 버전으로 전환한다.

```text
- npm run build 실패
- JSX 손상 재발
- route import 오류
- server-only/client boundary 오류
- package.json 변경 필요
- DB schema 불일치
- 정상 동작 중인 첨부/메모/작지 상태 흐름 회귀
```

## 우선순위 판단

당장 사용자에게 보이는 가치 기준:

1. `/admin/files` 파일 관리 read-only 복원
2. `/admin/history` 히스토리 read-only 복원
3. `/admin/partners` 거래처/공장관리 read-only 복원
4. `/admin/invites` 멤버 초대 UI 재연결
5. `/system/billing` 요금제·용량 UI 재연결
6. `/system/invites` 고객 초대 UI 재연결

기술 부채 기준:

1. JSX 손상 컴포넌트 목록 정리
2. route smoke 결과 문서화
3. API response shape 고정
4. DB patch/full_reset 정합성 유지
5. audit log 설계
