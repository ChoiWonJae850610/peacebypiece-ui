---
title: WAFL A-TYPE Permission UI Rules
version: 0.4
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-18
---


# 09. 권한별 UI 노출 규칙

## 1. 역할

```txt
고객사 관리자
디자이너
검수담당
재고/자재담당
조회전용
```

고객사 관리자는 멤버관리 목록과 권한 모달 대상에서 제외할 수 있다.

## 2. 메뉴 노출

```txt
접근 불가 메뉴는 숨김을 기본으로 한다.
사용자가 존재를 알아야 하는 경우 disabled + tooltip을 사용한다.
직접 URL 접근은 403 화면으로 처리한다.
```

## 3. 작업지시서 권한

```txt
조회 가능
작성 가능
발주 가능
```

규칙:

```txt
작성 가능 = 생성/수정/삭제 가능 + 조회 가능
작성 불가 = 본인 담당 작업지시서 조회만 가능
발주 가능 = 검토 없이 발주 요청까지 가능한 관리자급 흐름
```

## 4. 멤버 초대 권한

```txt
고객사 관리자: 멤버 초대 가능
일반 역할: 기본적으로 멤버 초대 불가
```

## 5. 버튼 노출

```txt
위험하거나 불가능한 액션: 숨김
사용자가 존재를 알아야 하는 액션: disabled + 이유
직접 접근: 403
```

## 6. 상태와 권한 결합

상태에 따라 버튼이 달라지는 경우 meta로 관리한다.

```ts
const WORK_ORDER_ACTION_META = {
  reviewRequested: {
    canApprove: ["customerAdmin", "inspection"],
    canReject: ["customerAdmin", "inspection"],
  },
};
```
