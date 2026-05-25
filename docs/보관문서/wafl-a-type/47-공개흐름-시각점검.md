---
title: WAFL A-TYPE Public Flow Visual Pass
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: applied
updated: 2026-05-20
---

# 47. 초대/승인/pending public 화면 visual pass

## 1. 목적

0.15.24는 로그인 이후 테스트 흐름에서 자주 통과하는 public 계열 화면을 A-TYPE 기준으로 보정한다.

대상 화면은 다음이다.

```txt
/login
/invite/company/[token]
/invite/member/[token]
/invite/error
/pending
/service-paused
```

이번 패치의 직접 보정 대상은 초대 링크 화면, 초대 오류 화면, pending 승인 대기 화면이다. 로그인과 service-paused 화면은 이미 ATypePublicFrame 기반이므로 구조를 유지한다.

## 2. 적용 원칙

```txt
- 기능 흐름은 변경하지 않는다.
- OAuth start/callback route는 변경하지 않는다.
- 초대 검증 API와 가입 신청 조회 API는 변경하지 않는다.
- raw stone/white 기반 표면 class를 public semantic token 중심으로 치환한다.
- status 색상은 pbp status semantic token을 사용한다.
- 승인 대기 사용자가 테스트 중 빠르게 세션을 종료할 수 있도록 logout action을 제공한다.
```

## 3. 화면별 변경 기준

### /invite/company/[token]

```txt
- 기존 초대 검증/Google 이동 흐름 유지
- 초대 상태 카드 안에 초대 유형과 만료일 요약 surface 추가
- 회사 정보 입력은 로그인 이후 승인 요청 흐름에서 진행한다는 안내 유지
```

### /invite/member/[token]

```txt
- 기존 초대 검증/Google 이동 흐름 유지
- 초대한 고객사와 만료일 요약 surface 추가
- 승인 전 업무 화면 접근 차단 안내 유지
```

### /invite/error

```txt
- English eyebrow를 한국어 "초대 오류"로 정리
- 오류 메시지 resolve 함수는 유지
- 로그인 화면 이동 action 유지
```

### /pending

```txt
- 전체 배경, header, lookup panel, summary card, access card, step card, policy note를 A-TYPE semantic token으로 보정
- disabled logout placeholder를 실제 /api/auth/logout POST form으로 변경
- 가입 신청 조회 입력/선택/버튼 UI를 semantic token 기반으로 정리
- 가입 신청 상태와 접근 범위 tone은 status semantic token으로 정리
```

## 4. 비변경 사항

```txt
- DB schema 변경 없음
- API 변경 없음
- R2 변경 없음
- 권한 판정 변경 없음
- OAuth redirect URI 변경 없음
- pending redirect guard 변경 없음
```

## 5. 후속 작업

```txt
0.16.0 — DeviceKind foundation
0.16.1 — Admin/Workspace shell에서 DeviceKind 읽기만 적용
0.16.2 — 모바일/태블릿 레이아웃 QA 기준 추가
```
