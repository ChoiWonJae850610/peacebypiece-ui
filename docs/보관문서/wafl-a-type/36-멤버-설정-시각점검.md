---
title: WAFL A-TYPE Member / Settings Visual Pass
version: 0.15.15
status: applied
updated: 2026-05-20
---

# 36. 멤버관리 / 환경설정 visual pass

## 1. 목적

0.15.15는 0.15.14 고객사 관리자 홈 visual pass 이후, 고객사 관리자가 자주 진입하는 멤버관리와 환경설정 화면의 시각 밀도를 A-TYPE 방향으로 보정한다.

## 2. 적용 범위

```txt
/admin/members
/admin/settings
```

## 3. 멤버관리 기준

```txt
- 상단 요약 카드를 단독 나열하지 않고 hero block 안에서 보여준다.
- 초대/멤버 탭은 기존 기능을 유지하되 큰 section 안에서 전환한다.
- 필터 영역은 별도 soft surface로 묶어 테이블과 구분한다.
- 멤버 초대, 승인, 권한 저장 로직은 변경하지 않는다.
```

## 4. 환경설정 기준

```txt
- 설정 허브는 큰 visual block으로 유지한다.
- 설정 메뉴 카드는 더 큰 radius, padding, shadow를 사용한다.
- 개인설정은 환경설정 카드가 아니라 상단 개인 아이콘 흐름으로 유지한다.
- 계정 요청, 기준정보, 요금제, 개발 건의 로직은 변경하지 않는다.
```

## 5. 비범위

```txt
- DB/API/R2/권한/세션 로직 변경
- 모바일/태블릿 전용 구현
- 멤버 권한 정책 변경
- 회사 정보 변경 요청 정책 변경
```
