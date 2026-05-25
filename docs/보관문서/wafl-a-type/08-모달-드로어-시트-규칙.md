---
title: WAFL A-TYPE Modal Drawer Sheet Rules
version: 0.4
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-18
---


# 08. 모달 / 드로어 / 시트 규칙

## 1. 기기별 사용 원칙

```txt
PC: 중앙 모달
태블릿 가로: 중앙 모달 또는 우측 드로어
태블릿 세로: 전체 화면 시트
모바일: 하단 시트 또는 전체 화면 시트
```

## 2. 공통 UX

```txt
- 배경 스크롤 차단
- focus trap
- Escape 닫기
- 닫기 버튼 제공
- dirty check
- 위험 액션 confirm
```

## 3. PC Modal

```txt
sm: 420px
md: 560px
lg: 720px
xl: 960px
```

긴 폼은 모달보다 별도 페이지를 우선한다.

## 4. Tablet Landscape Drawer

```txt
폭: 420~520px
위치: 우측
overlay: 32%
```

## 5. Tablet Portrait Fullscreen Sheet

```txt
상단 닫기 버튼
제목
본문 scroll
하단 고정 액션
```

## 6. Mobile Bottom Sheet

```txt
min: 280px
max: 80vh
```

## 7. 작업지시서 직접 그리기

```txt
- 태블릿 가로에서는 사용 차단 안내
- 태블릿 세로에서 사용 허용
- 회전 시 canvas state 보존
- PC에서는 충분한 화면 폭 확보 시 사용 가능
- 모바일에서는 기본적으로 제한하거나 단순 보기로 처리
```
