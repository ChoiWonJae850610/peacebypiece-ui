---
title: WAFL A-TYPE PC Visual Tuning 2
version: 1.0
baseline_source: peacebypiece-ui-0.15.23
status: implemented
updated: 2026-05-20
---

# 46. PC visual 보정 2차

## 1. 목적

0.15.22 visual QA 문서에서 분리한 PC 화면 후보를 기준으로, 실제 화면 코드를 최소 범위로 보정한다. 이번 버전은 기능 구현이 아니라 관리자 PC 화면의 surface, border, text token 정리와 카드 리듬 보정이 목적이다.

```txt
대상:
- /admin/settings
- /admin/members
- /admin/files
- /admin/stats
- /system

변경하지 않는 영역:
- DB schema
- API route
- R2 / 첨부 / 메모 / 삭제 / 복구 / purge
- 권한 / 세션 / companyId scope
- 작업지시서 본문 기능
```

## 2. 보정 원칙

```txt
- raw stone/white class를 일반 화면 surface token으로 치환한다.
- inverse hero 내부의 white 계열 표현도 가능한 경우 semantic inverse token 기반으로 바꾼다.
- common semantic class를 통해 멤버관리/저장소/통계 화면의 카드 밀도를 함께 보정한다.
- 기능 버튼, API 호출, selector, repository, DB 접근 흐름은 수정하지 않는다.
```

## 3. 공통 semantic class 보정

`components/admin/common/adminSemanticClassNames.ts`의 공통 surface class를 조정했다.

```txt
ADMIN_SURFACE_PANEL_CLASS
ADMIN_SURFACE_PANEL_COMPACT_CLASS
ADMIN_SURFACE_MUTED_PANEL_CLASS
ADMIN_SURFACE_SUBTLE_BOX_CLASS
ADMIN_SURFACE_ITEM_CLASS
ADMIN_FIELD_CONTAINER_CLASS

ADMIN_STORAGE_PANEL_CLASS
ADMIN_STORAGE_PANEL_TIGHT_CLASS
ADMIN_STORAGE_CARD_CLASS
ADMIN_STORAGE_CARD_MUTED_CLASS

ADMIN_STATS_PANEL_CLASS
ADMIN_STATS_PANEL_TIGHT_CLASS
ADMIN_STATS_MUTED_PANEL_CLASS
ADMIN_STATS_ITEM_CLASS
```

효과:

```txt
- 멤버관리: 역할/권한, 목록, modal section 주변 surface가 A-TYPE 카드 톤과 더 가까워진다.
- 저장소: 요약 카드와 휴지통/작업지시서 보관 section의 테두리·그림자 리듬이 통일된다.
- 통계: 누적 지표와 기간 분석 panel의 radius/그림자 리듬이 관리자 홈 카드와 가까워진다.
```

## 4. 환경설정 화면 보정

환경설정 세부 컴포넌트에서 raw stone/white class를 semantic token으로 바꿨다.

```txt
components/admin/settings/AdminCompanySettingsForm.tsx
components/admin/settings/AdminOrganizationSettingsSummary.tsx
components/admin/settings/AdminPolicyOverview.tsx
components/admin/settings/AdminUserAccessPreview.tsx
```

보정 내용:

```txt
- border-stone-* → border-[var(--pbp-border)] 또는 border-[var(--pbp-border-strong)]
- bg-stone-* / bg-white → bg-[var(--pbp-surface)] / bg-[var(--pbp-surface-muted)]
- text-stone-* → pbp text token 계열(primary / muted / subtle / secondary)
- inverse block 내부 white 표현 → pbp inverse token 기반 color-mix
```

## 5. 시스템관리자 홈 보정

`components/system/SystemConsoleShell.tsx`에서 inverse hero 내부 CTA와 chip의 raw white 표현을 semantic inverse token 기반으로 정리했다.

```txt
- 주요 CTA는 bg-[var(--pbp-surface)] 기반으로 유지
- inverse chip은 color-mix + var(--pbp-text-inverse) 기준으로 정리
- route/data/menu 구성은 변경하지 않음
```

## 6. 남은 후보

이번 버전은 PC visual 보정 2차의 최소 구현이다. 아래 항목은 다음 버전에서 별도 처리한다.

```txt
0.15.24 — 초대/승인/pending public 화면 visual pass
0.15.25 — 모달/스켈레톤 raw color 보정
0.15.26 — history/audit/extended system 화면 보정
0.16.0 — DeviceKind foundation
```

## 7. 검증 기준

```txt
/admin/settings
- 회사 정보 / 정책 / 사용자 접근 preview 영역의 stone 직접 class가 줄어들었는지 확인
- theme/language 선택 card가 기존 기능을 유지하는지 확인

/admin/members
- 요약 카드, 목록, 권한 modal section의 표면감이 기존보다 A-TYPE 카드와 가까운지 확인

/admin/files
- 저장소 요약, 휴지통, 작업지시서 보관 panel의 radius/그림자 리듬이 과하지 않은지 확인

/admin/stats
- 누적 지표, 기간 분석, Top card section의 panel 구분이 명확한지 확인

/system
- hero CTA와 chip이 기존보다 token 기반으로 정리되었는지 확인
```
