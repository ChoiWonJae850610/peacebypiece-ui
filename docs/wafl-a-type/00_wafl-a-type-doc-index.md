---
title: WAFL A-TYPE 문서 인덱스
version: 1.0
baseline_source: peacebypiece-ui-0.15.6
status: updated
updated: 2026-05-20
---


# WAFL A-TYPE 최종 문서 세트 v0.4

## 1. 문서 목적

이 문서 세트는 `peacebypiece-ui-0.13.50` 소스와 WAFL A-TYPE 이미지 시안을 기준으로, UI를 제품 수준으로 통일하기 위한 기준을 정의한다. v0.4에서는 모바일/태블릿 웹 공유 정책, 작업지시서 PDF 공유, 초대 링크 공유, PWA/앱 전환 판단 기준을 추가한다.

A-TYPE은 단순 테마가 아니라 다음을 포함한다.

```txt
브랜드 톤
디자인 토큰
공통 컴포넌트 규칙
화면 템플릿
기기별 레이아웃
상태/빈 상태/에러 규칙
폼/검증/제출 규칙
모달/드로어/시트 UX
권한별 UI 노출 정책
i18n/copy 정책
구현 아키텍처
소스 구조 감사
리팩토링 로드맵
QA 체크리스트
공유/PWA/앱 전략
```

## 2. 기준 이미지 반영 사항

```txt
- PC 규칙서 이미지 반영
- 태블릿 가로 화면 구성 이미지 반영
- 모바일 화면 구성 이미지 반영
- 로그인 A-TYPE 이미지 반영
- 작업지시서 A-TYPE PC 화면 이미지 반영
```

보완 사항:

```txt
- 태블릿 세로 화면 이미지는 아직 없음
- 태블릿 세로 규칙은 본 문서에서 별도로 정의
- 작업지시서 직접 그리기 기능은 태블릿 가로모드에서 차단된 기존 결정을 반영
- 로그인 문구는 최종 카피 확정 전까지 후보 문구로 관리
```

## 3. 문서 목록

```txt
00_wafl-a-type-doc-index.md
01_wafl-a-type-source-audit.md
02_wafl-a-type-design-tokens.md
03_wafl-a-type-component-spec.md
04_wafl-a-type-device-layout-rules.md
05_wafl-a-type-page-templates.md
06_wafl-a-type-state-empty-error-rules.md
07_wafl-a-type-form-validation-rules.md
08_wafl-a-type-modal-drawer-sheet-rules.md
09_wafl-a-type-permission-ui-rules.md
10_wafl-a-type-i18n-copy-rules.md
11_wafl-a-type-implementation-architecture.md
12_wafl-a-type-refactor-roadmap.md
13_wafl-a-type-qa-checklist.md
14_wafl-a-type-share-pwa-app-strategy.md
15_wafl-a-type-data-permission-policy.md
16_wafl-a-type-db-schema-policy.md
17_wafl-a-type-r2-file-policy.md
18_wafl-a-type-auth-session-policy.md
19_wafl-a-type-release-test-policy.md
20_wafl-a-type-page-inventory.md
21_wafl-a-type-source-refactor-audit.md
22_wafl-a-type-router-layout-implementation.md
23_wafl-a-type-shell-responsibility.md
24_wafl-a-type-admin-component-variants.md
25_wafl-a-type-login-invite-error-implementation.md
```

## 4. 핵심 결정

```txt
1. 코드의 기존 pbp prefix는 유지한다.
2. 문서상 브랜드/UI 규칙명은 WAFL A-TYPE으로 사용한다.
3. pbp semantic token을 WAFL A-TYPE semantic token으로 정의한다.
4. 기존 Admin* 컴포넌트는 버리지 않고 A-TYPE 기준으로 승격/정리한다.
5. PC / 태블릿 가로 / 태블릿 세로 / 모바일을 별도 규칙으로 정의한다.
6. 작업지시서 직접 그리기 기능은 태블릿 가로모드에서 사용을 제한한다.
7. 로그인/초대/에러/예외 화면도 A-TYPE 특수 화면 규칙에 포함한다.
8. i18n은 기존 ko/en 구조를 유지하되, hardcoded text를 점진적으로 줄인다.
9. 기능/DB/API/R2/권한/세션 흐름은 A-TYPE UI 전환에서 직접 수정하지 않는다.
10. 앱 개발은 후순위로 두고, 모바일/태블릿 웹에서 Web Share API 기반 공유를 먼저 적용한다.
11. 초대는 링크 공유, 작업지시서는 PDF 링크 공유를 기본 정책으로 한다.
12. 유료 SMS/Kakao 자동 발송 API는 2단계 기능으로 보류한다.
```

## 5. 0.14.9 문서 정리 기준

```txt
- 기준 문서는 docs/wafl-a-type/00~20으로 통일한다.
- 과거 버전별 작업 메모는 기준 문서로 사용하지 않는다.
- 확실히 중복되는 top-level legacy 문서는 삭제한다.
- DB/R2/auth/release/page inventory 정책은 15~20 문서로 보완한다.
```

```txt
26_wafl-a-type-customer-admin-home-implementation.md
27_wafl-a-type-customer-admin-management-screens.md
```


## 0.15.7 업데이트

```txt
28_wafl-a-type-customer-admin-data-screens.md
- 고객사 관리자 저장소/통계/협력업체 A-TYPE 1차 적용 기준
```
