# 49. WAFL A-TYPE public/auth 문구 UX 정리 2차

Version: 0.15.26

## 목적

0.15.25에서 `/pending` 화면의 개발자성 대시보드를 사용자용 상태 안내 화면으로 단순화한 뒤, public/auth 계열 화면에 남은 내부 용어와 개발자성 오류 문구를 2차로 정리한다.

## 적용 대상

```txt
- /
- /login
- /invite/error
- /invite/company/[token]
- /invite/member/[token]
- /service-paused
```

## 정리 기준

### 제거 또는 완화할 표현

```txt
- Client ID
- Client Secret
- OAuth 설정
- 세션 보안 설정
- 데이터베이스 연결 설정
- 초대 토큰
- scope mismatch
- permission template
- Trial 7일
- 영문 eyebrow 문구
- 앱 버전 노출
```

### 사용자용 표현 원칙

```txt
- 사용자가 지금 무엇을 해야 하는지 먼저 안내한다.
- 내부 설정 오류는 “관리자에게 문의” 수준으로 완화한다.
- 초대 오류는 링크 만료/재요청/다시 로그인 중심으로 표현한다.
- 권한/DB/API/토큰/스코프 같은 구현 용어는 public 화면에 노출하지 않는다.
```

## 화면별 반영 내용

### 로그인 화면

```txt
변경:
- 영문 eyebrow 제거
- Google Client ID/Secret, DB, 세션 보안 설정 등 내부 오류 문구를 사용자용 문구로 변경

유지:
- Google 로그인 버튼
- 등록 또는 승인된 계정만 사용할 수 있다는 안내
```

### 초대 오류 화면

```txt
변경:
- “초대 오류” 중심 표현을 “초대 링크 안내”로 완화
- 초대 토큰, OAuth 설정, scope mismatch 등 내부 원인 표현 제거
- 새 초대 링크 요청과 다시 로그인 안내 중심으로 정리

유지:
- 로그인 화면으로 이동 버튼
```

### 고객사 관리자 초대 화면

```txt
변경:
- 영문 eyebrow 제거
- Trial 7일 문구 제거
- “Google 이메일과 초대 이메일 일치 여부 검사” 같은 운영 정책 설명 제거
- 회사 정보/담당자 정보/승인 요청/관리자 검토 중심으로 정리

유지:
- 초대 검증 API
- Google 로그인 시작 URL
- 초대 만료일 표시
```

### 멤버 초대 화면

```txt
변경:
- 영문 eyebrow 제거
- 권한 템플릿 표현 제거
- 승인 전 접근 차단 설명을 승인 후 사용 가능 안내로 완화

유지:
- 초대한 고객사 표시
- 초대 만료일 표시
- Google 로그인 시작 URL
```

### 서비스 중지/접근 제한 화면

```txt
변경:
- public 화면 eyebrow에서 앱 버전 노출 제거

유지:
- 상태 안내
- 회사/계정/상태 요약
- 이동/로그아웃 액션
```

## 변경하지 않은 것

```txt
- OAuth redirect
- 세션 생성/삭제
- 초대 검증 API
- 가입 신청 조회 API
- DB schema
- R2
- 권한 판정
- 라우트 구조
```

## 후속 작업

```txt
0.15.27 — system 화면 개발자성 문구 정리
0.15.28 — admin 화면 개발자성 placeholder 정리
0.16.0 — DeviceKind foundation
```
