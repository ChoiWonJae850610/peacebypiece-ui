---
title: WAFL A-TYPE 문서 인덱스
version: 1.0
baseline_source: peacebypiece-ui-0.15.43
status: updated
updated: 2026-05-20
---

# WAFL A-TYPE 최종 문서 세트 v0.5

## 1. 문서 목적

이 문서 세트는 WAFL A-TYPE 이미지 시안과 현재 PeaceByPiece/WAFL 소스를 기준으로, UI·운영 IA·업무 흐름·결제/증빙 정책을 제품 수준으로 통일하기 위한 기준을 정의한다.

v0.15에서는 0.15.43 기준으로 작업지시서 history category/filter/tone, memo history action, workorder kind, attachment scope 사용을 상수 중심으로 정리하고 생산구성 저장 누락 흐름을 보강한다.

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
A-TYPE visual QA / raw color / hardcoded text 점검
PC visual 보정 2차
초대/승인/pending public 화면 visual pass
개발자성 UI/문구 전수 감사
public/auth 문구 UX 정리 2차
system 화면 개발자성 문구 정리
admin 화면 개발자성 placeholder 정리
코드 품질 / 도메인 구조 전수 감사
domain constants/types 1차 정리
formatter/presentation 통합 1차
TSX 도메인 로직 분리 1차
DB 저장값 / JSON payload 감사
member/workorder/storage status constants 후보 조사
workorder status usage 정리 1차
workorder action type constants 정리 1차
작업지시서 생산구성 저장 흐름 보강
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
- 0.15.22 기준 visual QA에서 stone/white 직접 class, raw hex, hardcoded text 후보를 분류하고 0.15.23 이후 보정 순서를 정리했다.
- 0.15.23 기준 공통 surface class와 환경설정/시스템관리자 홈의 PC visual token을 2차 보정했다.
- 0.15.24 기준 초대/승인/pending public 화면의 raw stone/white class를 A-TYPE semantic token 중심으로 보정했다.
- 0.15.25 기준 pending 화면의 requestId/permission_code 등 내부 용어와 개발자성 대시보드 구성을 제거하고 사용자용 상태 안내 화면으로 단순화했다.
- 0.15.26 기준 public/auth 화면의 Client ID, 토큰, permission template 등 내부 표현을 사용자용 문구로 정리했다.
- 0.15.27 기준 system 화면의 raw token, token_hash, seed, SQL, permission_code 등 개발자성 문구를 운영자용 문구로 정리했다.
- 0.15.28 기준 admin 화면의 설계 중, 준비 중, DB, API, permission_code, role template 등 개발자성 placeholder 문구를 운영자용 문구로 정리했다.
- 0.15.29 기준 settingsForm i18n key mismatch 빌드 오류를 수정하고 문자열 비교, raw payload, 하드코딩, 중복 함수, any 사용 후보를 전수 감사했다.
- 0.15.30 기준 userAccessPreview i18n key mismatch 빌드 오류를 수정하고 usage risk/file kind domain code를 도입했다.
- 0.15.31 기준 숫자, 금액, 수량+단위, 저장공간 용량 formatter 중복 구현을 공통 유틸로 1차 통합했다.
- 0.15.32 기준 시스템 고객사 승인 화면의 TSX 도메인 로직을 presentation 계층으로 1차 분리했다.
- 0.15.33 기준 DB 저장값, JSON payload, metadata, raw token, reason/status 저장 후보를 감사하고 SystemCompanyApprovalConsole의 누락 import 빌드 오류를 수정했다.
- 0.15.34 기준 회사 온보딩, 구독, 가입 신청, 초대 status constants와 normalize helper를 추가했다.
- 0.15.35 기준 member/storage status constants를 추가하고 workorder status 정리 후보를 문서화했다.
- 0.15.40 기준 검토 요청 등 state patch 저장 시 공장/원단/부자재/외주공정 생산구성이 누락되지 않도록 state patch와 DB 동기화 흐름을 보강했다.
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
45_wafl-a-type-visual-qa-audit.md
46_wafl-a-type-pc-visual-tuning-2.md
47_wafl-a-type-public-flow-visual-pass.md
48_wafl-a-type-developer-ui-copy-audit.md
49_wafl-a-type-public-auth-copy-ux.md
50_wafl-a-type-system-copy-ux.md
51_wafl-a-type-admin-copy-ux.md
52_wafl-a-type-code-quality-domain-audit.md
53_wafl-a-type-domain-constants-types.md
54_wafl-a-type-formatter-presentation-consolidation.md
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
19. raw color class는 theme/print/chart/drawing과 일반 화면을 분리해 점진적으로 제거한다.
20. hardcoded Korean text는 i18n ko 파일과 사용자 화면 직접 문구를 구분해 보정한다.
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




### 0.15.22 업데이트

```txt
45_wafl-a-type-visual-qa-audit.md
- A-TYPE visual QA / raw color / hardcoded text 점검
- bg-white / border-stone / text-stone / raw hex / 한국어 문자열 탐지 결과 정리
- theme/print/chart/drawing 색상과 일반 화면 색상 class를 분리
- 0.15.23 이후 PC visual 보정 후보를 /admin/settings, /admin/members, /admin/files, /admin/stats, /system으로 정리
- 기능/API/DB/R2/권한/세션 변경 없음
```


### 0.15.23 업데이트

```txt
46_wafl-a-type-pc-visual-tuning-2.md
- PC visual 보정 2차
- 공통 admin surface/storage/stats semantic class의 radius/그림자/token 리듬 보정
- /admin/settings 세부 컴포넌트의 stone/white 직접 class를 semantic token으로 치환
- /system hero chip/CTA의 inverse token 정리
- 기능/API/DB/R2/권한/세션 변경 없음
```

### 0.15.24 업데이트

```txt
47_wafl-a-type-public-flow-visual-pass.md
- 초대/승인/pending public 화면 visual pass 기준
- public 화면의 A-TYPE semantic token 적용 범위 정리
- OAuth/초대 검증/승인 조회 API/DB/R2 흐름 변경 없음
```

### 0.15.25 업데이트

```txt
48_wafl-a-type-developer-ui-copy-audit.md
- 개발자성 UI/문구 전수 감사 기준
- /pending 화면을 사용자용 승인 대기 상태 안내로 단순화
- requestId / join_requests / permission_code 등 내부 용어 노출 제거
- public/system/admin/workspace 화면별 후속 정리 대상 분류
- OAuth/초대 검증/승인 조회 API/DB/R2 흐름 변경 없음
```


### 0.15.26 업데이트

```txt
49_wafl-a-type-public-auth-copy-ux.md
- public/auth 계열 화면의 사용자용 문구 UX 2차 정리
- 로그인/초대 오류/고객사 초대/멤버 초대/서비스 제한 화면의 내부 용어 노출 완화
- Client ID / Secret / DB / OAuth / 토큰 / scope / permission template / Trial 7일 표현 제거
- OAuth/초대 검증/승인 조회 API/DB/R2 흐름 변경 없음
```

### 0.15.27 업데이트

```txt
50_wafl-a-type-system-copy-ux.md
- system 화면 개발자성 문구 정리
- /system, /system/companies, /system/billing, /system/invites, /system/standards/seed-status, /system/access-checkpoint 대상
- preview / seed / fallback / DB / API / Worker / R2 / 내부 테이블명 노출 완화
- 시스템관리자에게 필요한 운영 상태와 최종 액션 중심으로 문구 정리
- DB/API/R2/권한/세션 변경 없음
```


### 0.15.28 업데이트

```txt
51_wafl-a-type-admin-copy-ux.md
- admin 화면 개발자성 placeholder 정리
- /admin, /admin/settings, /admin/members, /admin/files, /admin/stats 대상
- 설계 중/준비 중/개발중/DB/API/permission_code/role template/샘플/preview 표현 완화
- 고객사 관리자에게 필요한 운영 상태와 다음 액션 중심으로 문구 정리
- DB/API/R2/권한/세션 변경 없음
```


### 0.15.30 업데이트

```txt
53_wafl-a-type-domain-constants-types.md
- domain constants/types 1차 정리
- usage risk normal/warning/exceeded code 추가
- file kind document/design/other code 추가
- /system/billing의 위험도 badge 조건을 한글 label 비교에서 tone 기반으로 변경
- /admin/files snapshot의 파일 유형 분류에서 한글 includes 비교 제거
- AdminUserAccessPreview 영문 i18n key 누락 빌드 오류 수정
```


### 0.15.31 업데이트

```txt
54_wafl-a-type-formatter-presentation-consolidation.md
- formatter/presentation 통합 1차
- lib/utils/formatters.ts 추가
- 숫자/금액/수량+단위/저장공간 용량 formatter 공통화
- billing/admin/system/stats 일부 중복 formatter 제거
- DB/API/R2/권한/세션 변경 없음
```

### 0.15.32 업데이트

```txt
55_wafl-a-type-tsx-domain-logic-separation.md
- TSX 도메인 로직 분리 1차
- 시스템 고객사 승인 화면의 row 변환, 상태 판정, filter 판정, 초대 링크 상태 표시 helper를 presentation 계층으로 이동
- components/system/companies/SystemCompanyApprovalConsole.tsx는 화면 조립과 이벤트 처리 중심으로 축소
- DB/API/R2/권한/세션 변경 없음
```


### 0.15.33 업데이트

```txt
56_wafl-a-type-db-payload-storage-audit.md
- DB 저장값 / JSON payload 감사
member/workorder/storage status constants 후보 조사
workorder status usage 정리 1차
workorder action type constants 정리 1차
- raw token 미저장, metadata/jsonb 허용 범위, request_payload 주의 항목 정리
- company_account_requests.request_payload, workorders/status legacy payload 후보, status text + check constraint 정리 필요성 분류
- SystemCompanyApprovalConsole의 isPdfOnboardingFile import 누락 빌드 오류 수정
- DB schema/API/R2/권한/세션 변경 없음
```

## 0.15.36 추가 기록

- 0.15.36 기준 작업지시서 workflow 상태값의 직접 문자열 사용을 줄이기 위해 `WORKFLOW_STATE`와 `DISPLAY_STAGE` 상수를 추가했다.
- DB 저장값과 API 응답 포맷은 변경하지 않았다.


### 0.15.38 업데이트

```txt
61_wafl-a-type-workorder-history-reason-constants.md
- workorder action/result/history reason 상수화 후보 조사 및 history constants 1차
- lib/constants/workorderHistory.ts 추가
- HISTORY_CATEGORY / HISTORY_FILTER / HISTORY_TONE / MEMO_HISTORY_ACTION 기준 추가
- history builders, history filter, inventory history projection의 category/tone/filter 직접 문자열 사용 축소
- DB 저장값/API 응답/R2/권한/세션 변경 없음
```


### 0.15.39 업데이트

```txt
62_wafl-a-type-workorder-kind-attachment-scope-constants.md
63_wafl-a-type-workorder-production-composition-persistence.md
- workorder kind / attachment scope constants 정리 1차
- lib/constants/workorderIdentity.ts 추가
- WORK_ORDER_KIND / ATTACHMENT_SCOPE / UPLOADABLE_ATTACHMENT_SCOPES 기준 추가
- 리오더/재작업/첨부 업로드/대표 디자인 조건의 직접 문자열 비교 일부 축소
- DB 저장값/API 응답/R2/권한/세션 변경 없음
```

### 0.15.41 업데이트

```txt
64_wafl-a-type-workorder-pending-edit-flush.md
- 작업지시서 생산구성 활성 입력값 검토요청 전 반영 보강
- 원단/부자재/외주 수량 및 단가 입력 중 검토요청/임시저장을 눌러도 현재 편집값을 먼저 commit하도록 조정
- WorkOrderDetailContainer에서 workflow action/save 실행 전 detail editor pending edit을 flush
- DB schema/API/R2/권한/세션 변경 없음
```


- `docs/wafl-a-type/65_wafl-a-type-workorder-live-production-draft.md` — 작업지시서 생산구성 숫자 입력값 실시간 draft 반영


### 0.15.43 업데이트

```txt
66_wafl-a-type-workorder-production-snapshot-action.md
- 작업지시서 생산구성 workflow action snapshot 보강
- 검토요청 실행 시 detail editor local state와 현재 editingValue를 action override로 전달
- 원단/부자재/외주/공장 수량·단가가 0으로 떨어지는 문제 보정
- DB schema/API/R2/권한/세션 변경 없음
```

- `67_wafl-a-type-production-composition-commit-policy.md` — 생산구성 확정 저장 정책과 workflow snapshot 보정

### 0.15.45 업데이트

```txt
68_wafl-a-type-production-composition-field-mapping.md
- 생산구성 숫자 필드 mapping 통합
- 원단/부자재/외주/공장 row의 quantity/unitCost/amount 계열 alias를 중앙 helper에서 normalize
- workflow snapshot, state patch, DB sync 직전까지 같은 기준을 사용
- DB schema/API/R2/권한/세션 변경 없음
```
- `69_wafl-a-type-production-composition-read-numeric.md` — 생산구성 조회 numeric 문자열 복원 기준
- `70_wafl-a-type-production-tables-schema-audit.md` — 생산구성 현재값 테이블 schema audit
- `71_wafl-a-type-production-replace-save.md` — 생산구성 현재값 replace 저장 1차
- `72_wafl-a-type-production-reject-preserve.md` — 반려/취소성 workflow의 생산구성 보존 기준


### 0.15.50 업데이트

```txt
73_wafl-a-type-workorder-service-action-map.md
- 작업지시서 화면의 DB/R2 변경 동작을 service code 기준으로 분류
- 즉시 저장, 생산구성 저장, forward workflow, backward workflow, 메모, 첨부/R2, 저장소/purge 액션을 구분
- 검토요청/발주요청과 반려/취소성 workflow가 건드려도 되는 테이블을 분리
- 생산구성 replace 저장은 forward/명시 저장 액션에서만 허용하는 기준을 문서화
- 실제 DB schema/API/R2 구현은 변경하지 않음
```


### 0.15.51 업데이트

```txt
74_wafl-a-type-workorder-db-r2-call-audit.md
- 작업지시서 관련 API / client / repository의 DB/R2 호출 위치를 현재 코드 기준으로 전수조사
- 서비스 코드별 실제 호출 경로, 대상 테이블, query 유형, R2 영향 범위를 정리
- 반려/취소 계열에서 생산구성 replace 저장이 타면 안 되는 지점을 별도 위험 항목으로 분리
- 후속 serviceCode constants / allowlist 도입 전 기준 문서로 사용
- 실제 DB schema/API/R2 구현은 변경하지 않음
```


### 0.15.52 업데이트

```txt
75_wafl-a-type-workorder-service-code-constants.md
- 작업지시서 서비스 액션 맵을 코드 상수로 1차 도입
- workflow action을 service code로 변환하는 기준 helper 추가
- 생산구성 replace 저장 allowlist를 service code 기준으로 분리
- 반려/취소/되돌리기/메모/첨부/삭제 계열은 생산구성 replace 저장 금지 기준으로 둠
- 누락된 app constants를 복원해 빌드 오류를 수정
```


### 0.15.53 업데이트

```txt
76_wafl-a-type-workorder-service-side-effect-matrix.md
- 작업지시서 serviceCode별 DB/R2 side effect matrix를 코드/문서 기준으로 추가
- serviceCode direction, resource, operation, R2 delete 허용 여부를 분리
- 메모/첨부/R2/삭제/복원/purge 계열이 생산구성 replace와 섞이지 않도록 후속 guard 기준 마련
- DB schema/API/R2 동작 변경 없음
```


### 0.15.54 업데이트

```txt
77_wafl-a-type-workorder-service-guard-first-pass.md
- serviceCode side effect matrix를 실제 state patch 저장 직전 guard에 연결
- 생산구성 replace는 serviceCode가 replace operation과 생산구성 resource를 모두 허용할 때만 통과
- 반려/취소/되돌리기/메모/첨부/삭제/복원/purge 계열에서 생산구성 patch가 섞여도 저장 전에 제거
- DB schema/API/R2 동작 변경 없음
```


### 0.15.55 업데이트

```txt
78_wafl-a-type-workorder-side-effect-route-guards.md
- 메모/첨부/R2/저장소 route에 serviceCode side effect guard를 1차 연결
- route별 resource/operation 조합이 serviceCode matrix를 통과하는지 저장 직전 확인
- R2 실제 purge는 WO-S004 trashPurge serviceCode에서만 통과
- DB schema/R2 key/권한/세션 흐름 변경 없음
```


### 0.15.56 업데이트

```txt
79_wafl-a-type-workorder-state-patch-server-guard.md
- 작업지시서 state patch에 serviceCode를 포함
- 서버 route에서 serviceCode 유효성 확인
- 생산구성 replace 미허용 serviceCode의 생산구성 patch를 서버에서 제거
- system audit source에 serviceCode를 포함해 추적성 보강
- DB schema/R2 key/권한/세션 흐름 변경 없음
```
- `80_wafl-a-type-workorder-reject-production-preserve.md` — 반려/취소 workflow 생산구성 보존 보강

- [81_wafl-a-type-workorder-production-sync-gate.md](./81_wafl-a-type-workorder-production-sync-gate.md) — 0.15.58 반려 workflow에서 생산구성 repository sync 차단

- [82_wafl-a-type-review-request-production-service-code-forward.md](./82_wafl-a-type-review-request-production-service-code-forward.md) — 0.15.59 검토요청 생산구성 serviceCode 전달 보강

- [83_wafl-a-type-workorder-review-reject-regression.md](./83_wafl-a-type-workorder-review-reject-regression.md) — 0.15.60 검토요청/반려/재검토요청 회귀 테스트 기준

- [84_wafl-a-type-workorder-service-code-screen-action-audit.md](./84_wafl-a-type-workorder-service-code-screen-action-audit.md) — 0.15.61 작업지시서 화면 액션별 serviceCode 연결 상태 점검

- [85_wafl-a-type-workorder-service-code-first-wire.md](./85_wafl-a-type-workorder-service-code-first-wire.md) — 0.15.62 작업지시서 serviceCode 누락 액션 1차 연결

- [86_wafl-a-type-workorder-service-code-workflow-wire.md](./86_wafl-a-type-workorder-service-code-workflow-wire.md) — 0.15.63 작업지시서 workflow/save serviceCode 연결 보강
