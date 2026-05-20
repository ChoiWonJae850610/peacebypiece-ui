---
title: WAFL A-TYPE 문서 인덱스
version: 1.0
baseline_source: peacebypiece-ui-0.15.21
status: updated
updated: 2026-05-20
---

# WAFL A-TYPE 최종 문서 세트 v0.5

## 1. 문서 목적

이 문서 세트는 WAFL A-TYPE 이미지 시안과 현재 PeaceByPiece/WAFL 소스를 기준으로, UI·운영 IA·업무 흐름·결제/증빙 정책을 제품 수준으로 통일하기 위한 기준을 정의한다.

v0.8에서는 작업지시서 발주 flow와 원단/부자재 발주 업무의 연결 기준을 상세화한다.

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
시스템관리자/고객사관리자 운영 IA
원단/부자재 발주 업무 흐름
카드결제/청구/증빙 정책
운영 IA 기반 홈/메뉴 매핑
원단/부자재 발주 데이터 모델
작업지시서 발주 flow 변경 설계
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
- 결제/증빙/원단 발주 화면은 0.15.19 기준 홈/메뉴 진입 구조만 반영했고 기능 구현 전이다.
- 원단/부자재 발주는 0.15.20 기준 데이터 모델과 권한 matrix를 상세화했으나 DB schema는 아직 반영하지 않았다.
- 작업지시서 발주 flow는 0.15.21 기준 자재 발주 준비/검토요청/직접발주/PDF 출력 시점을 분리해 설계했다.
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
26_wafl-a-type-customer-admin-home-implementation.md
27_wafl-a-type-customer-admin-management-screens.md
28_wafl-a-type-customer-admin-data-screens.md
29_wafl-a-type-system-admin-screens.md
30_wafl-a-type-system-admin-extended-screens.md
31_wafl-a-type-admin-stats-screen.md
32_wafl-a-type-system-standards-detail-screens.md
33_wafl-a-type-workspace-worker-structure-audit.md
34_wafl-a-type-system-admin-remaining-screens.md
35_wafl-a-type-customer-admin-home-visual-pass.md
36_wafl-a-type-member-settings-visual-pass.md
37_wafl-a-type-data-screens-visual-pass.md
38_wafl-a-type-system-home-visual-pass.md
39_wafl-a-type-service-operation-ia.md
40_wafl-a-type-material-order-workflow.md
41_wafl-a-type-billing-payment-evidence-policy.md
42_wafl-a-type-operation-menu-mapping.md
43_wafl-a-type-material-order-data-model.md
44_wafl-a-type-workorder-order-flow.md
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
13. 시스템관리자 운영 IA는 고객사 업무 화면과 분리한다.
14. 고객사관리자 결제/증빙 화면은 본인 회사 범위로 제한한다.
15. 원단/부자재 발주는 작업지시서 내부 모달만으로 처리하지 않고 별도 업무 흐름으로 분리한다.
16. 카드결제는 PG의 customerKey/billingKey 기반으로 처리하고 전체 카드번호/CVC/카드 비밀번호/주민등록번호/카드 유효기간 원문은 저장하지 않는다.
17. 원단/부자재 발주는 work_order_material_rows, material_purchase_orders, material_purchase_order_items의 3계층 모델을 기본 설계로 둔다.
18. 원단/부자재 발주 권한은 초기 UI에서는 단순화하되 내부 설계는 view/request/approve/direct/execute/receive/cancel로 확장 가능하게 둔다.
```

## 5. 0.14.9 문서 정리 기준

```txt
- 기준 문서는 docs/wafl-a-type/00~20으로 통일한다.
- 과거 버전별 작업 메모는 기준 문서로 사용하지 않는다.
- 확실히 중복되는 top-level legacy 문서는 삭제한다.
- DB/R2/auth/release/page inventory 정책은 15~20 문서로 보완한다.
```

## 6. 0.15.x 업데이트 기록

### 0.15.7 업데이트

```txt
28_wafl-a-type-customer-admin-data-screens.md
29_wafl-a-type-system-admin-screens.md
- 고객사 관리자 저장소/통계/협력업체 A-TYPE 1차 적용 기준
```

### 0.15.9 업데이트

```txt
30_wafl-a-type-system-admin-extended-screens.md
- 시스템관리자 감사로그/요금제/기준정보 확장 화면의 SystemShell 적용 기준
- 고객사 관리/저장소 사용량에 이어 시스템관리자 확장 화면도 같은 shell 책임으로 정리
```

### 0.15.10 업데이트

```txt
31_wafl-a-type-admin-stats-screen.md
- 고객사 관리자 통계정보 화면의 A-TYPE section 적용 기준
- 누적 운영 지표와 작업흐름분석을 별도 AdminSection으로 분리
- 통계 계산/차트/필터 로직은 변경하지 않고 화면 구조만 정리
```

### 0.15.11 업데이트

```txt
32_wafl-a-type-system-standards-detail-screens.md
33_wafl-a-type-workspace-worker-structure-audit.md
- 시스템관리자 기준정보 세부 화면의 SystemShell 적용 기준
- category-rules/processes/units/product-templates의 page-level wrapper 중복 제거
- 기준정보 CRUD/API/DB 로직은 변경하지 않고 화면 shell 기준만 정리
```

### 0.15.12 업데이트

```txt
33_wafl-a-type-workspace-worker-structure-audit.md
- Workspace/Worker 화면 구조 점검
- MemberWorkspaceShell/Home의 A-TYPE semantic token 1차 적용
- WorkOrderWorkspace는 high risk 영역으로 분리하고 DeviceKind 이후 본격 정리
```

### 0.15.13 업데이트

```txt
34_wafl-a-type-system-admin-remaining-screens.md
- /system/invites는 /system/companies redirect route로 유지
- /system/access-checkpoint SystemShell 적용
- /system/standards/regression SystemShell 적용
- /system/standards/seed-status SystemShell 적용
- 개발 점검 화면의 page-level wrapper 중복 제거와 semantic token 1차 보정
```

### 0.15.14 업데이트

```txt
35_wafl-a-type-customer-admin-home-visual-pass.md
- 고객사 관리자 홈의 작업지시서 현황 hero visual pass
- 주요 대기 현황 2x2 queue card 정리
- 업무 바로가기 featured card 적용
- 기능/API/DB/R2/권한/세션 변경 없음
```

### 0.15.15 업데이트

```txt
36_wafl-a-type-member-settings-visual-pass.md
- 멤버관리/환경설정 visual pass 기준
- 기능/API/DB/R2/권한/세션 변경 없음
```

### 0.15.16 업데이트

```txt
37_wafl-a-type-data-screens-visual-pass.md
- 고객사 관리자 저장소/협력업체/통계 화면의 visual pass 기준
- 저장소 요약 hero, 협력업체 network hero, 통계 누적 지표 hero 보정
- 기능/API/DB/R2/권한/세션 변경 없음
```

### 0.15.17 업데이트

```txt
38_wafl-a-type-system-home-visual-pass.md
- 시스템관리자 홈 visual pass 기준
- 시스템 운영 hero, quick card, SystemStatsOverview 노출 기준
- 기능/API/DB/R2/권한/세션 변경 없음
```

### 0.15.18 업데이트

```txt
39_wafl-a-type-service-operation-ia.md
40_wafl-a-type-material-order-workflow.md
41_wafl-a-type-billing-payment-evidence-policy.md
- 시스템관리자/고객사관리자 SaaS 운영 IA
- 원단/부자재 발주 업무 흐름
- 카드결제/청구/증빙 정책
- 기능/API/DB/R2/권한/세션 변경 없음
```


### 0.15.19 업데이트

```txt
42_wafl-a-type-operation-menu-mapping.md
- 0.15.18 운영 IA를 시스템관리자 홈 섹션과 고객사관리자 홈 카드에 1차 매핑
- 고객사관리자 환경설정에 약관·정책 준비 카드 추가
- 결제/증빙/원단 발주 기능 구현은 후속 버전으로 유지
```


### 0.15.20 업데이트

```txt
43_wafl-a-type-material-order-data-model.md
- 원단/부자재 발주 데이터 모델 상세 설계
- work_order_material_rows / material_purchase_orders / material_purchase_order_items 3계층 모델 정리
- materials.order 계열 권한 matrix 정리
- 작업지시서와 자재 발주 연결 방식 및 full_reset 반영 여부 검토
- DB schema/API/화면 구현은 아직 제외
```


### 0.15.21 업데이트

```txt
44_wafl-a-type-workorder-order-flow.md
- 작업지시서 발주요청/PDF flow 재정의
- 작업지시서 상태와 자재 발주 상태 분리
- 자재 발주 준비/검토요청/직접발주 버튼 역할 정리
- PDF 출력 시점을 작업지시서/초안/확정/공유 PDF로 분리
- DB schema/API/화면 구현은 아직 제외
```

