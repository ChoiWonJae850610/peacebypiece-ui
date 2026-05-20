---
title: WAFL A-TYPE Visual QA / Raw Color / Hardcoded Text Audit
version: 1.0
baseline_source: peacebypiece-ui-0.15.22
status: audit-complete
updated: 2026-05-20
---

# 45. A-TYPE visual QA / raw color / hardcoded text 점검

## 1. 목적

0.15.x A-TYPE visual pass 이후 PC 관리자 화면의 남은 시각적 부채를 정리한다. 이 문서는 즉시 수정 지시서가 아니라 0.15.23 이후 보정 순서를 정하는 QA 기준 문서다.

```txt
점검 범위:
- app
- components
- lib
- 관리자/시스템관리자/작업지시서 관련 TypeScript/TSX 파일

점검 항목:
- bg-white 직접 사용
- border-stone 직접 사용
- text-stone 직접 사용
- raw hex color 직접 사용
- i18n을 거치지 않은 한국어 문구
- A-TYPE 시안과 가장 다른 화면 후보
```

## 2. 자동 점검 요약

0.15.21 소스 기준으로 정적 문자열 검색을 수행했다. 수치는 정확한 오류 개수가 아니라 후속 보정 우선순위를 정하기 위한 탐지 신호다.

```txt
bg-white:
- 탐지 파일: 68개
- 탐지 건수: 185건

border-stone:
- 탐지 파일: 65개
- 탐지 건수: 265건

text-stone:
- 탐지 파일: 76개
- 탐지 건수: 504건

raw hex color:
- 탐지 파일: 15개
- 탐지 건수: 647건

한국어 문자열:
- 탐지 파일: 217개
- 탐지 건수: 65259건
```

해석 기준:

```txt
- lib/i18n/ko/* 내부 한국어는 정상이다.
- theme 파일의 hex color는 정상이다.
- chart palette와 print 문서용 색상은 별도 정책으로 분리한다.
- 문제 후보는 화면 컴포넌트 내부의 직접 색상 class와 i18n fallback 없이 박힌 한국어 문구다.
```

## 3. raw color class 우선 점검 대상

### 3.1 bg-white 사용량 상위 후보

```txt
components/invitations/PendingApprovalDashboard.tsx
components/admin/settings/AdminCompanySettingsForm.tsx
components/system/invitations/SystemCustomerInviteSkeleton.tsx
components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
components/admin/invitations/CompanyMemberInviteSkeleton.tsx
components/workorder/list/WorkOrderListCard.tsx
components/system/SystemConsoleShell.tsx
components/debug/AdminHistoryDebugPanel.tsx
components/admin/settings/AdminOrganizationSettingsSummary.tsx
components/admin/dashboard/AdminOperationsDashboard.tsx
```

판단:

```txt
- PendingApprovalDashboard / invite skeleton 계열은 public-onboarding과 system-admin 경계 화면이므로 0.15.23 PC visual 보정 전 별도 후보로 둔다.
- OrderRequestDocumentPreview는 PDF/발주 문서 미리보기 성격이 있어 일반 A-TYPE card token으로 일괄 치환하면 안 된다.
- AdminOperationsDashboard는 0.15.14 이후 visual pass 대상이므로 남은 bg-white는 의도된 hero contrast인지 확인 후 보정한다.
```

### 3.2 border-stone 사용량 상위 후보

```txt
components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
components/invitations/PendingApprovalDashboard.tsx
components/system/invitations/SystemCustomerInviteSkeleton.tsx
components/system/audit/SystemAuditLogsDesignPage.tsx
components/admin/standards/AdminFilePolicySettingsModal.tsx
components/admin/invitations/CompanyMemberInviteSkeleton.tsx
components/system/billing/SystemCompanyPlanSkeleton.tsx
components/workorder/WorkOrderLoadingState.tsx
components/admin/standards/StandardManagementModalFrame.tsx
components/admin/partnerMaster/PartnerMasterFormModal.tsx
```

판단:

```txt
- 모달/문서 미리보기/스켈레톤은 공통 surface token 적용 후보가 많다.
- SystemAuditLogsDesignPage와 SystemCompanyPlanSkeleton은 시스템관리자 확장 화면 보정 후보로 분리한다.
- PartnerMasterFormModal과 StandardManagementModalFrame은 모달 공통 shell 규칙과 충돌하지 않게 따로 보정한다.
```

### 3.3 text-stone 사용량 상위 후보

```txt
components/invitations/PendingApprovalDashboard.tsx
components/system/invitations/SystemCustomerInviteSkeleton.tsx
components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
components/system/billing/SystemCompanyPlanSkeleton.tsx
components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx
components/admin/invitations/CompanyMemberInviteSkeleton.tsx
components/debug/AdminHistoryDebugPanel.tsx
components/admin/settings/AdminPolicyOverview.tsx
components/admin/common/AdminDateRangePicker.tsx
```

판단:

```txt
- mobile/tablet 전용 작업지시서 detail section은 0.16.x DeviceKind 이후 보정한다.
- AdminDateRangePicker는 공통 calendar 컴포넌트 후보이므로 한 화면에서 직접 수정하지 않는다.
- AdminPolicyOverview는 /admin/legal route 구현 전 준비 카드 정책과 함께 보정한다.
```

## 4. raw hex 사용 점검 기준

raw hex 탐지 상위는 theme 파일에 집중되어 있다.

```txt
lib/theme/themes/defaultLight.ts
lib/theme/themes/softEmerald.ts
lib/theme/themes/coldWinter.ts
lib/theme/themes/blackAndWhite.ts
lib/theme/themes/beigeAtelier.ts
lib/workorder/presentation/orderRequestDocumentPrint.ts
lib/admin/theme.ts
lib/data/sample/attachments.ts
components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
lib/admin/chartPalette.ts
```

판단:

```txt
정상 후보:
- lib/theme/themes/*
- lib/theme/semanticThemeTokens.ts
- lib/admin/chartPalette.ts

분리 검토 후보:
- lib/workorder/presentation/orderRequestDocumentPrint.ts
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
- components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
```

정책:

```txt
- theme 정의 파일의 hex는 유지한다.
- PDF/print 전용 색상은 theme token과 별도 print token으로 분리한다.
- drawing canvas 색상은 사용자 입력/도구 색상 정책으로 분리한다.
- 일반 화면 컴포넌트 내부의 hex만 우선 제거한다.
```

## 5. hardcoded Korean text 점검 기준

한국어 문자열 탐지는 i18n ko 파일 때문에 수치가 크게 나온다. 따라서 다음 기준으로 분류한다.

```txt
정상:
- lib/i18n/ko/*
- seed/sample/mock label 문서화 목적 문자열
- DB audit message 후보 중 아직 정책화되지 않은 내부 시스템 메시지

보정 후보:
- page.tsx 안의 title/description 직접 한국어
- component 내부 button/empty/error 문구 직접 한국어
- API route 응답 message 직접 한국어
- history/audit message가 사용자 화면에 그대로 노출되는 문자열
```

상위 보정 후보:

```txt
app/(admin)/admin/page.tsx
app/(admin)/admin/settings/page.tsx
app/(public)/invite/error/page.tsx
app/(public)/service-paused/page.tsx
app/api/admin/files/snapshot/route.ts
app/api/admin/partners/route.ts
app/api/admin/standards/processes/route.ts
components/system/companies/SystemCompanyApprovalConsole.tsx
components/admin/members/AdminMemberManagementDashboard.tsx
components/system/standards/SystemProductTemplateStandardsPage.tsx
```

정책:

```txt
- 화면 문구는 i18n key로 이동한다.
- API 응답 message는 user-facing 여부를 먼저 구분한다.
- audit log message는 code + params 형태를 우선 검토한다.
- 한국어 문장을 DB column에 장문으로 저장하는 구조는 피한다.
```

## 6. 화면별 A-TYPE 괴리 후보

### 6.1 0.15.23 우선 보정 후보

```txt
1. /admin/settings
   - 회사 정보/정책/개발 건의 카드가 아직 설정 화면 느낌이 강하다.
   - A-TYPE의 editorial surface와 여백 리듬을 더 적용할 수 있다.

2. /admin/members
   - 멤버 목록과 승인/초대 흐름의 정보 밀도가 높다.
   - role/permission card를 더 단순한 operation panel로 정리할 여지가 있다.

3. /admin/files
   - 저장소 화면은 기능 밀도가 높아 visual pass 이후에도 table/surface 대비가 강하다.
   - 삭제 요청/휴지통/파일 유형 영역의 card hierarchy를 더 통일할 수 있다.

4. /admin/stats
   - chart와 period analysis가 섞여 있어 A-TYPE hero 이후의 section rhythm 점검이 필요하다.

5. /system
   - 홈 visual pass는 완료됐지만 확장 메뉴가 늘어나면서 section title과 card density를 재점검해야 한다.
```

### 6.2 0.16.x 이후로 미룰 후보

```txt
- workorder mobile/tablet detail section
- DeviceKind 기반 orientation guard
- PC narrow width와 실제 mobile/tablet 분리
- drawing canvas 관련 색상/레이아웃
```

### 6.3 기능 구현과 함께 볼 후보

```txt
- /admin/billing placeholder
- /admin/legal placeholder
- /admin/material-orders placeholder
- /workspace/material-orders placeholder
- 원단/부자재 발주 PDF preview
```

## 7. 0.15.23 보정 원칙

0.15.23은 실제 화면 보정 패치로 진행한다. 단, 다음 범위를 지킨다.

```txt
허용:
- 관리자 PC 화면의 visual rhythm 보정
- card/surface class를 기존 공통 컴포넌트 variant로 이동
- 직접 stone/white class 일부를 semantic token 또는 공통 class로 교체
- i18n key가 이미 존재하는 문구의 fallback 정리
- 문서화된 준비 중 카드의 visual consistency 보정

금지:
- DB schema 변경
- API 응답 포맷 변경
- R2/첨부/메모/삭제/복구/purge 흐름 변경
- 권한/세션/companyId logic 변경
- 작업지시서 본체 구조 대수정
- 모바일/태블릿 전용 구조 변경
- PDF/print 색상 일괄 치환
```

## 8. 권장 작업 순서

```txt
0.15.23:
- /admin/settings
- /admin/members
- /admin/files
- /admin/stats
- /system
- 공통 surface class 후보 정리

0.15.24:
- 초대/승인/pending public 화면 visual pass
- service-paused / invite-error hardcoded text i18n 정리

0.15.25:
- 시스템관리자 확장 화면 visual pass
- audit/billing/standards skeleton 계열 stone class 정리

0.15.26:
- orderRequest preview / PDF preview 색상 정책 분리
- print token 문서화

0.16.0:
- DeviceKind foundation으로 이동
```

## 9. 결론

0.15.x visual pass는 주요 관리자 화면의 방향을 잡는 데는 충분하지만, 아직 코드 전체에는 stone/white 직접 class와 화면 내부 한국어 문구가 남아 있다. 즉시 일괄 제거하면 PDF/print, theme, chart, mobile/tablet, drawing canvas까지 같이 흔들릴 수 있으므로 0.15.23에서는 PC 관리자 화면의 surface rhythm 보정만 제한적으로 진행한다.
