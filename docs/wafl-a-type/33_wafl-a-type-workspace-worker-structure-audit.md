---
title: WAFL A-TYPE Workspace / Worker Structure Audit
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-20
---

# 33. Workspace / Worker 화면 구조 점검

## 1. 목적

이 문서는 `/workspace`와 `/worker` 화면을 A-TYPE으로 전환하기 전에 현재 구조와 리스크를 정리한다.

이번 단계에서는 작업지시서 동작, DB, API, R2, 권한, 세션 흐름을 변경하지 않는다.
PC A-TYPE 전환의 마지막 구조 점검 단계이며, tablet/mobile 전용 구현은 0.16.x 이후로 둔다.

## 2. 현재 route 구조

```txt
app/(workspace)/workspace/layout.tsx
app/(workspace)/workspace/page.tsx
app/(workspace)/workspace/partners/page.tsx
app/(workspace)/workspace/standards/page.tsx
app/(workspace)/worker/layout.tsx
app/(workspace)/worker/page.tsx
```

외부 URL은 유지한다.

```txt
/workspace
/workspace/partners
/workspace/standards
/worker
```

## 3. 현재 shell 구조

### 3.1 `/workspace`

`/workspace` 홈은 `MemberWorkspaceHome`이 자체 `main/header/card` 구조를 가지고 있다.
`/workspace/partners`, `/workspace/standards`는 `MemberWorkspaceShell`을 사용한다.

판단:

```txt
- MemberWorkspaceShell을 workspace 계열 공통 shell로 유지한다.
- MemberWorkspaceHome은 추후 MemberWorkspaceShell 기반으로 흡수 가능하다.
- 이번 단계에서는 raw color와 surface 표현만 A-TYPE semantic token 기준으로 줄인다.
```

### 3.2 `/worker`

`/worker`는 `WorkOrderWorkspace`가 자체 작업지시서 전용 layout을 사용한다.
내부에는 이미 desktop/tablet/mobile 분기와 작업지시서 전용 layout이 존재한다.

판단:

```txt
- /worker를 MemberWorkspaceShell로 감싸지 않는다.
- 작업지시서 화면은 별도 WorkOrder shell/viewport로 유지한다.
- 직접 그리기, 첨부, 메모, 3열 layout이 얽혀 있으므로 A-TYPE 전환은 별도 단계로 둔다.
```

## 4. 선행 정리 원칙

```txt
- URL 변경 금지
- 작업지시서 선택/검색/정렬 query 유지
- /worker의 3열 PC 구조는 0.15.x에서 유지
- tablet/mobile 전용 재구성은 0.16.x에서 별도 처리
- 작업지시서 직접 그리기 orientation guard는 0.16.x에서 처리
```

## 5. 0.15.12에서 반영한 사항

```txt
- MemberWorkspaceShell의 background/text/header surface를 A-TYPE semantic token 기준으로 정리
- MemberWorkspaceHome의 background/card/chip/action/status 표현을 A-TYPE semantic token 기준으로 정리
- /worker 작업지시서 기능 코드와 layout은 변경하지 않음
```

## 6. 다음 권장 작업

### 6.1 0.15.13 후보 — 잔여 시스템 화면 정리

```txt
/system/invites
/system/access-checkpoint
/system/standards/regression
/system/standards/seed-status
```

### 6.2 0.16.0 후보 — DeviceKind foundation

```txt
pc
tablet-landscape
tablet-portrait
mobile
```

DeviceKind는 PC 브라우저 축소와 실제 mobile/tablet 기기를 구분할 수 있게 설계한다.

### 6.3 0.16.2 후보 — 작업지시서 기기별 layout

```txt
PC: 3열 유지
tablet-landscape: 2열
tablet-portrait/mobile: 목록/상세 분리
```

## 7. 리스크

```txt
- WorkOrderWorkspace는 high risk 영역이다.
- R2 첨부/메모/preview/download와 연결되어 있다.
- workflow state, selection state, query state가 한 화면에 밀집되어 있다.
- 직접 그리기 canvas state와 orientation 처리가 별도로 필요하다.
```

따라서 `/worker`는 PC A-TYPE surface를 가볍게 보정한 뒤, 반응형 구조 변경은 DeviceKind 도입 이후로 진행한다.
