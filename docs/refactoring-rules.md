# Refactoring Rules

기준 버전: 0.16.48
상태: working rules
목적: WAFLOW / PeaceByPiece 리팩토링 중 지켜야 할 금지·허용 기준을 고정한다.

## 1. 최우선 원칙

```txt
- 기능 확장보다 구조 안정화를 우선한다.
- 한 패치에서 목표 외 흐름을 과도하게 건드리지 않는다.
- working 작업지시서/R2/첨부/메모/휴지통/purge 흐름은 직접 목표가 아니면 변경하지 않는다.
- mock/fallback으로 정상처럼 보이게 만들지 않는다.
- 데이터 없음은 empty state로 처리한다.
```

## 2. 계층별 금지 규칙

### app

```txt
금지:
- DB query 직접 작성
- 업무 상태 전이 직접 처리
- role/status/companyId 직접 비교
- 긴 event handler 작성
- fixture/mock 직접 선언
```

### features

```txt
금지:
- DB/R2 직접 호출
- companyId scope 직접 조립
- 권한 정책을 문자열 비교로 직접 구현
- 화면별로 capability 기준 중복 작성
```

### lib

```txt
금지:
- service와 repository 책임 혼합
- repository에서 companyId 없이 업무 데이터 조회
- API route로 다시 업무 로직 역류
- secret/token/실제 DB·R2 URL 로그 출력
```

### components

```txt
금지:
- API 호출
- 권한 판단
- 상태 전이 처리
- DB/R2 처리
```

## 3. 권한 정리 규칙

권한은 네 단계로 나눈다.

```txt
route guard = URL 접근 가능 여부
capability  = 화면 버튼/액션 가능 여부
API guard   = 서버 요청 실행 가능 여부
repository  = companyId scope 강제
```

금지:

```txt
- route guard만 믿고 API guard 생략
- 버튼 숨김만 믿고 서버 권한 생략
- TSX에서 role/status 문자열 직접 비교
- 고객사 관리자/멤버/시스템관리자 기준 혼합
```

## 4. companyId scope 규칙

```txt
- workspace 데이터는 실제 로그인 세션의 companyId 기준으로 조회한다.
- demo company fallback을 사용하지 않는다.
- companyId가 없으면 임시 회사로 조회하지 않는다.
- 다른 회사 데이터가 섞일 수 있는 query는 작성하지 않는다.
```

## 5. fallback / mock / legacy 제거 규칙

```txt
금지:
- demo company fallback
- mock member fallback
- mock workorder fallback
- legacy R2 key compatibility 유지
- old /admin 화면 path 의존
- 실제 화면 경로에서 fixture 데이터 사용
```

허용:

```txt
- 기능 목업 단계의 fixture
- features/*/__fixtures__ 내부 fixture
- 문서에 명확히 표시된 미연결 화면 데이터
```

## 6. DB / payload 규칙

```txt
- 통계/검색/권한/상태에 쓰는 값은 컬럼화한다.
- 원단·부자재 주요 정보는 payload가 아니라 테이블/컬럼으로 관리한다.
- 임시 UI 상태는 DB에 저장하지 않는다.
- JSON은 보조 메타데이터에 제한한다.
```

개발 상태에서는 full reset이 가능하므로 어색한 legacy schema를 억지로 유지하지 않는다.

## 7. UI / WAFL 테마 규칙

```txt
- WAFL 테마 토큰을 유지한다.
- 공통 Button/Card/Input/Table/Badge/Modal을 우선 사용한다.
- 하드코딩 색상 추가를 피한다.
- semantic status color는 테마색과 구분해서 유지한다.
- modal focus trap, Escape close, background scroll lock, mobile top fixed close button을 유지한다.
```

## 8. i18n 규칙

```txt
- 사용자 표시 문구는 i18n 가능성을 확인한다.
- 기술 경로명이나 개발자성 표현을 사용자 문구에 노출하지 않는다.
- 고객사 화면과 시스템관리자 화면의 용어를 섞지 않는다.
- '연결 첨부' 같은 모호한 표현을 피하고 역할 기반 라벨을 사용한다.
```

## 9. patch 산출물 규칙

```txt
- patch zip 이름: peacebypiece-patch-{version}-files.zip
- zip은 flat 구조로 제공한다.
- zip 최상위에 commit-meta.md와 path-converted 파일을 둔다.
- path separator는 __로 변환한다.
- commit-meta.md는 실제 프로젝트 경로를 적는다.
- APP_VERSION, commit-meta.md Version, 답변 버전, zip 파일명 버전을 일치시킨다.
```

commit-meta.md 라벨 형식:

```txt
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

## 10. build / 검증 규칙

```txt
- ChatGPT/container에서 npm run build를 실행하지 않는다.
- 답변에 'npm run build 미실행 — 사용자가 로컬에서 확인'을 명시한다.
- package.json/package-lock.json 변경이 있으면 명확히 표시한다.
- DB schema/full_reset 변경이 있으면 영향 범위를 명확히 표시한다.
- .env.local, secrets, tokens, 실제 DB/R2 URL을 포함하지 않는다.
```

## 11. 멈춰야 하는 경우

다음 상황에서는 임의로 진행하지 않고 사용자 결정을 먼저 받는다.

```txt
- 기능 방향이 문서 기준과 충돌하는 경우
- DB schema를 실제로 변경해야 하는 경우
- package.json/package-lock.json 변경이 필요한 경우
- 기존 정상 R2/첨부/메모/휴지통/purge 흐름을 건드려야 하는 경우
- /admin legacy redirect를 둘지 말지 선택이 필요한 경우. 0.16.24 기준 기본 정책은 redirect를 두지 않고 /workspace 기준으로 정리한다.
- 권한 정책이 기존 결정과 충돌하는 경우
- 화면 IA가 기존 결정과 충돌하는 경우
```

## 12. 0.16.25 이후 작업 순서 규칙

0.16.25 이후에는 구조 안정화 구간에서 생긴 다음 후보를 기능 개발과 섞지 않는다.

```txt
1. build/type 오류 보정은 다음 기능 작업과 함께 하되, 원인을 명시한다.
2. API prefix rename은 /api/workspace alias 추가 → client fetch 이동 → /api/admin 제거 순서로 나눈다.
3. components/admin, lib/admin rename은 import churn이 크므로 기능 변경과 분리한다.
4. DB schema 변경은 full_reset.sql, smoke test, repository, service를 같은 버전에서 맞춘다.
5. 원단·부자재 통계/감사로그/R2 편입은 각각 별도 버전으로 처리한다.
6. 작업지시서 기존 발주 미리보기, 첨부, 메모, 휴지통, purge 흐름은 직접 목표가 아니면 유지한다.
```

특히 원단·부자재 기능은 현재 다음 단계에 있다.

```txt
완료:
- /workspace/materials 기준정보 화면
- materials DB/API 1차 연결
- 작업지시서 상세 연결 line
- line order_status 변경
- 권한별 UI/API 조건 연결

후속:
- 실제 감사로그 기록
- 통계 집계
- 발주서/PDF snapshot 반영 여부
- 파일 첨부/R2 편입 여부
```
