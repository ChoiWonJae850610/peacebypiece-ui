---
title: WAFL A-TYPE Customer Admin Home Visual Pass
version: 0.15.14
baseline_source: peacebypiece-ui-0.15.13
status: applied
updated: 2026-05-20
---

# 35. 고객사 관리자 홈 visual pass

## 1. 목적

0.15.14는 기존의 token/shell/surface 정리보다 더 명확한 시각 전환을 목표로 한다.

```txt
이전 단계:
- route group
- shell 분리
- common component variant
- surface token 정리

이번 단계:
- 고객사 관리자 홈에서 A-TYPE 시안의 큰 면, 여백, 카드 리듬을 먼저 체감할 수 있게 정리
```

## 2. 적용 화면

```txt
/admin
```

## 3. 적용 범위

```txt
- 작업지시서 현황 hero 영역
- 주요 대기 현황 queue card
- 선택 queue 목록 영역
- 업무 바로가기 카드 그리드
```

## 4. 변경 원칙

```txt
- 기능/API/DB/R2/권한/세션 로직은 변경하지 않는다.
- PC visual pass만 진행한다.
- 모바일/태블릿 전용 구현은 0.16.x 이후로 둔다.
- 기존 AdminShell, AdminButton, AdminStatusBadge, AdminCard 구조를 활용한다.
- 고객사 관리자 홈에서 환경설정 카드는 계속 노출하지 않는다.
```

## 5. Visual 기준

```txt
- 상단 작업지시서 현황은 큰 brand hero block으로 표현한다.
- queue summary는 2x2 카드로 크게 보여준다.
- 선택된 queue는 selected surface로 강조한다.
- 작업지시서 목록은 hero 아래의 별도 surface에 배치한다.
- 업무 바로가기의 작업지시서 카드는 featured card로 강조한다.
- 5개 카드의 역할과 리듬이 한 화면에서 구분되게 한다.
```

## 6. 후속 작업

```txt
0.15.15 — 멤버관리/환경설정 visual pass
0.15.16 — 저장소/협력업체/통계 visual pass
0.15.17 — 시스템관리자 홈/주요 화면 visual pass
0.15.18 — A-TYPE visual QA / raw color / hardcoded text 점검
0.16.0 — DeviceKind foundation
```
