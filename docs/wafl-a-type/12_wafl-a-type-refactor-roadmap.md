---
title: WAFL A-TYPE Refactor Roadmap
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---


# 12. A-TYPE 전환 로드맵

## 0. 현재 진행 기준 업데이트

```txt
현재 기준: 0.14.8
완료: A-TYPE 문서 00~14 반영, semantic token 1차 정리
이번 보완: docs 기준 문서 00~20 체계화, legacy version note 정리
다음 우선순위: Admin 공통 컴포넌트 A-TYPE variant 정리 → 로그인/초대/에러 화면 → 고객사 관리자 주요 화면 → 시스템관리자 주요 화면 → DeviceKind/모바일/태블릿
```


## 1. 기준

```txt
현재 기준: 0.13.50
목표: WAFL A-TYPE 제품 UI 통일
원칙: 작은 버전 단위, 기능 회귀 최소화
```

## 2. 추천 버전 계획

### 0.13.51 — 문서 세트 v0.4 생성

```txt
코드 수정 없음
A-TYPE 최종 문서 세트 생성
- 공유/PWA/앱 전략 추가
- 초대 링크 공유, 작업지시서 PDF 공유 정책 추가
```

### 0.13.52 — Token / Theme 정리

```txt
beige-atelier를 A-TYPE 기준으로 정리
pbp token 문서와 코드 매칭
raw color 사용 금지 기준 준비
```

### 0.13.53 — Admin common component 정리

```txt
AdminButton / AdminCard / AdminStatusBadge / AdminEmptyState / AdminFilterBar / AdminTable
```

### 0.13.54 — Login / Invite / Error / Share A-TYPE화

```txt
WaflLoginPage token화
로그인 문구 정리
invite error page 정리
not-found/error/forbidden 화면 추가 또는 정리
```

### 0.13.55 — AdminShell / Topbar / Sidebar 정리

```txt
PC 수치 기준 적용
sidebar/header/page padding 정리
```

### 0.13.56 — PC 주요 화면 통일

```txt
운영대시보드 / 작업지시서 / 협력업체 / 저장소 / 통계 / 멤버관리 / 환경설정
```

### 0.13.57 — Device policy 확장

```txt
pc/tablet-landscape/tablet-portrait/mobile
작업지시서 device hook 확장
태블릿 세로 규칙 반영
```

### 0.13.58 — Drawing orientation guard 정리

```txt
태블릿 가로 직접 그리기 차단 정책 문서와 코드 일치
canvas draft 보존 점검
```

### 0.13.59 이후 — 태블릿/모바일 전용 화면 확장

```txt
태블릿 가로 / 태블릿 세로 / 모바일 하단 탭 / 모바일 카드 리스트 / 하단 시트/전체 시트
```

## 3. 리스크별 분리

Low risk:

```txt
문서 / token alias / Admin common style / Empty/Error state
```

Medium risk:

```txt
AdminShell / Login/Invite page / i18n key 이동 / device hook
```

High risk:

```txt
WorkOrderWorkspace 구조 / R2/첨부/메모 / storage purge / permission/session/companyId / DB schema
```

---

## 4. 앱/PWA 관련 로드맵

### 1단계 — 모바일/태블릿 웹 공유

```txt
- Web Share API 기반 공유
- 링크 복사 fallback
- QR 보기
- PDF 링크 공유
```

### 2단계 — PWA 검토

```txt
- 홈 화면 추가
- manifest
- 아이콘
- offline fallback
- 제한적 캐시 정책
```

### 3단계 — 앱 MVP 검토

```txt
- 푸시 알림이 필요할 때
- 오프라인 입력이 필요할 때
- 네이티브 카메라/파일 권한이 필요할 때
- 앱스토어/플레이스토어 배포가 필요할 때
```

앱 개발은 PC A-TYPE 통일과 모바일/태블릿 웹 공유 기능 이후로 둔다.
