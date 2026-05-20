---
title: WAFL A-TYPE Login / Invite / Error Implementation
version: 0.9
baseline_source: peacebypiece-ui-0.15.4
status: updated
updated: 2026-05-20
---

# 25. Login / Invite / Error A-TYPE 적용 기준

## 1. 목적

0.15.4에서는 public/auth 계열 화면을 A-TYPE 특수 화면 기준으로 정리한다.

대상:

```txt
/
 /login
 /invite/company/[token]
 /invite/member/[token]
 /invite/error
 /service-paused
```

## 2. 공통 구조

```txt
ATypePublicFrame
- Brand header
- Hero message
- Feature chips
- Action card
- Footer notice

ATypePublicCard
- Eyebrow
- Title
- Description
- Action area

ATypePublicNotice
- neutral / info / warning / danger / success tone
```

## 3. 로그인 화면

로그인 화면은 과한 감성문구를 제거하고 제품 목적을 직접 드러낸다.

```txt
업무를 연결하고,
협업을 완성하세요.

작업 배정부터 결과 관리까지 WAFL이 패션 생산의 흐름을 한 화면에서 연결합니다.
```

## 4. 초대 화면

초대 화면은 고객사 관리자 초대와 멤버 초대를 같은 프레임으로 맞춘다.

```txt
고객사 관리자 초대:
- 고객사 관리자 등록 시작
- Google 본인 확인
- 회사 정보 입력과 승인 요청 안내

멤버 초대:
- WAFL 멤버 참여 요청
- Google 본인 확인
- 관리자 승인 대기 안내
```

자동 SMS/Kakao/이메일 발송으로 오해될 수 있는 문구는 사용하지 않는다.

## 5. 초대 오류 화면

초대 오류 화면은 내부 오류 코드를 노출하지 않고 다음 행동을 제공한다.

```txt
- 초대 링크를 열 수 없습니다.
- 링크 상태를 확인해 주세요.
- 로그인 화면으로 이동
```

## 6. 서비스 중지 화면

서비스 중지 화면은 public A-TYPE 프레임을 사용하되, 기존 billing/access view model을 유지한다.

## 7. 변경하지 않은 것

```txt
- Google OAuth 시작 route
- invitation verify API
- approval pending flow
- service paused business logic
- DB/API/R2/권한/세션 로직
```

## 8. 다음 단계

```txt
0.15.5 — 고객사 관리자 주요 화면 A-TYPE
0.15.6 — 시스템관리자 주요 화면 A-TYPE
```
